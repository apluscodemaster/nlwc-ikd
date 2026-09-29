// Server-only: recovery-code generation, hashing and signed claim links.
// Imported exclusively by quiz API routes (never by client code).
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  RECOVERY_CODE_TTL_HOURS,
  RECOVERY_LINK_PARAM,
  normalizeRecoveryCode,
} from "./quizSecurity";

// Same pepper family as the security-answer hash (quizSecurity.server.ts).
const PEPPER =
  process.env.QUIZ_SECURITY_PEPPER ||
  process.env.WEBHOOK_SECRET ||
  "nlwc-quiz-security-fallback-pepper";

/** Unambiguous alphabet — no 0/O, 1/I/L, so the code survives being read aloud. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** A fresh random code, e.g. "KJ7Q4PXW" (display it via formatRecoveryCode). */
export function generateRecoveryCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

export function hashRecoveryCode(code: string): string {
  return createHmac("sha256", PEPPER)
    .update(`recovery:${normalizeRecoveryCode(code)}`)
    .digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// ── Signed claim links ──────────────────────────────────────────────────────
// A link is just the code + session id, signed so the URL cannot be forged or
// pointed at another session. Redeeming a link goes through exactly the same
// single-use / expiry check as typing the code, so there is one credential.

interface ClaimPayload {
  sid: string;
  code: string;
  /** Epoch seconds. */
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", PEPPER).update(`claim:${payload}`).digest("base64url");
}

export function signClaimToken(payload: ClaimPayload): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifyClaimToken(token: string): ClaimPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<ClaimPayload>;
    if (
      typeof payload.sid !== "string" ||
      typeof payload.code !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp * 1000 < Date.now()) return null;
    return payload as ClaimPayload;
  } catch {
    return null;
  }
}

export function buildRecoveryLink(origin: string, token: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  return `${base}/sermons/quiz?${RECOVERY_LINK_PARAM}=${encodeURIComponent(token)}`;
}

// ── Issue & redeem ──────────────────────────────────────────────────────────

export interface IssuedRecovery {
  code: string;
  token: string;
  expiresAt: string;
}

/**
 * Create (or replace) the single active code for a session. Only the hash is
 * stored; the plaintext goes back to the admin once and is never retrievable.
 */
export async function issueRecoveryCode(
  sessionId: string,
  issuedBy: string | null,
): Promise<IssuedRecovery> {
  const code = generateRecoveryCode();
  const expires = new Date(Date.now() + RECOVERY_CODE_TTL_HOURS * 3_600_000);

  const { error } = await getSupabaseAdmin()
    .from("session_recovery_codes")
    .upsert(
      {
        session_id: sessionId,
        code_hash: hashRecoveryCode(code),
        issued_by: issuedBy,
        issued_at: new Date().toISOString(),
        expires_at: expires.toISOString(),
        used_at: null,
      },
      { onConflict: "session_id" },
    );
  if (error) throw new Error(error.message);

  const token = signClaimToken({
    sid: sessionId,
    code,
    exp: Math.floor(expires.getTime() / 1000),
  });
  return { code, token, expiresAt: expires.toISOString() };
}

/** Whether an unexpired, unused code exists for the session. */
export async function hasActiveRecoveryCode(sessionId: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from("session_recovery_codes")
    .select("expires_at, used_at")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!data || data.used_at) return false;
  return new Date(data.expires_at).getTime() > Date.now();
}

/**
 * Redeem a code for a session. On success the code is burnt and any existing
 * security question is cleared (the player never knew it, or forgot it), so
 * the next thing they do is set a fresh one with no cooldown in the way.
 * Returns false for any mismatch, expiry or reuse — callers reply generically.
 */
export async function redeemRecoveryCode(
  sessionId: string,
  code: string,
): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("session_recovery_codes")
    .select("code_hash, expires_at, used_at")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!data || data.used_at) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;
  if (!safeEqualHex(hashRecoveryCode(code), data.code_hash)) return false;

  // Burn it first so a concurrent second attempt can't also succeed.
  const { data: burnt } = await db
    .from("session_recovery_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .is("used_at", null)
    .select("session_id");
  if (!burnt || burnt.length === 0) return false;

  await db.from("session_security").delete().eq("session_id", sessionId);
  await db
    .from("sessions")
    .update({ security_set: false })
    .eq("session_id", sessionId);
  return true;
}
