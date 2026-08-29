/**
 * Authentication utilities for API routes
 * Uses Firebase Admin SDK for proper server-side token verification, with a
 * signature-verifying fallback if the Admin SDK is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { createVerify, createPublicKey } from "node:crypto";
import { getAdminAuth } from "@/lib/firebase-admin";

/**
 * Google's public X.509 certs for Firebase ID tokens, keyed by `kid`.
 * Rotated periodically, so the response's max-age is honoured.
 */
const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache: { certs: Record<string, string>; expiresAt: number } | null =
  null;

/** The verified identity behind an authenticated request. */
export interface AuthActor {
  uid: string;
  email: string | null;
}

async function getGoogleSigningCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expiresAt > Date.now()) return certCache.certs;

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) {
    throw new Error(`Could not fetch Google signing certs (${res.status})`);
  }
  const certs = (await res.json()) as Record<string, string>;

  const maxAge = /max-age=(\d+)/.exec(res.headers.get("cache-control") || "");
  const ttlMs = maxAge ? parseInt(maxAge[1], 10) * 1000 : 60 * 60 * 1000;
  certCache = { certs, expiresAt: Date.now() + ttlMs };
  return certs;
}

/** RS256-verify `header.payload` against an X.509 cert PEM. */
function hasValidSignature(token: string, certPem: string): boolean {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  return verifier.verify(
    createPublicKey(certPem),
    Buffer.from(signatureB64, "base64url"),
  );
}

/**
 * Verify a Firebase ID token server-side.
 *
 * Primary: Firebase Admin SDK verifyIdToken().
 *
 * Fallback (Admin SDK not initialised): verify the RS256 signature against
 * Google's published certs, THEN check the claims.
 *
 * ⚠️ The signature check is the whole point of the fallback. It previously
 * base64-decoded the payload and checked iss/aud/exp only — never touching the
 * signature — so ANY forged token with the right claims was accepted. The
 * project id used in those claims comes from NEXT_PUBLIC_FIREBASE_PROJECT_ID,
 * which ships in the client bundle, so the "secret" was public. That made every
 * requireAuth() route (publish, update, devotionals, quiz, schedule) trivially
 * bypassable whenever the Admin SDK failed to initialise. Never accept a token
 * here without verifying its signature.
 */
async function verifyFirebaseToken(token: string): Promise<{ valid: boolean; error?: string; actor?: AuthActor }> {
  // ── Primary: Firebase Admin SDK ───────────────────────────────────────────
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    return {
      valid: true,
      actor: { uid: decoded.uid, email: decoded.email ?? null },
    };
  } catch (adminError) {
    const msg = adminError instanceof Error ? adminError.message : String(adminError);
    // If the token itself is invalid/expired, don't fall through
    if (msg.includes("expired") || msg.includes("revoked")) {
      return { valid: false, error: "Token expired" };
    }
    if (msg.includes("argument") || msg.includes("Decoding") || msg.includes("malformed")) {
      return { valid: false, error: "Malformed token" };
    }
    // Admin SDK not initialised — fall through to manual decode
    console.warn("[auth] Firebase Admin unavailable, falling back to manual JWT check:", msg);
  }

  // ── Fallback: manual JWT decode ───────────────────────────────────────────
  try {
    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      return { valid: false, error: "Server configuration error: no project ID" };
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed token" };
    }

    // ── Signature first: nothing in the payload can be trusted until the
    // token is proven to have been signed by Google. ──
    const header = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf-8"),
    );
    if (header.alg !== "RS256") {
      return { valid: false, error: "Unexpected token algorithm" };
    }
    if (!header.kid || typeof header.kid !== "string") {
      return { valid: false, error: "Token missing key id" };
    }

    const certs = await getGoogleSigningCerts();
    const cert = certs[header.kid];
    if (!cert) {
      return { valid: false, error: "Unknown token signing key" };
    }
    if (!hasValidSignature(token, cert)) {
      return { valid: false, error: "Invalid token signature" };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
      return { valid: false, error: "Invalid token issuer" };
    }
    if (payload.aud !== projectId) {
      return { valid: false, error: "Invalid token audience" };
    }
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token expired" };
    }
    if (payload.iat && payload.iat > now + 60) {
      return { valid: false, error: "Token issued in the future" };
    }
    if (!payload.sub || typeof payload.sub !== "string") {
      return { valid: false, error: "Missing subject claim" };
    }
    // Only read identity AFTER the signature and every claim check above have
    // passed — these values become the actor recorded in the audit log, so a
    // forged token must never be able to put someone else's name on an action.
    return {
      valid: true,
      actor: {
        uid: payload.sub,
        email: typeof payload.email === "string" ? payload.email : null,
      },
    };
  } catch {
    return { valid: false, error: "Failed to decode token" };
  }
}

/**
 * Verify Authorization header contains a valid Firebase ID token.
 * Supports Bearer token format: Authorization: Bearer <token>
 *
 * On success also returns `actor` — the verified identity behind the request.
 * Audit entries must take the actor from here and never from a client-supplied
 * body field, otherwise any admin could write another admin's name into the log.
 */
export async function verifyAuthHeader(request: NextRequest): Promise<{ isValid: boolean; error?: string; actor?: AuthActor }> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return { isValid: false, error: "Missing Authorization header" };
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer") {
    return { isValid: false, error: "Invalid authorization scheme. Use 'Bearer <token>'" };
  }

  if (!token) {
    return { isValid: false, error: "Missing authorization token" };
  }

  const result = await verifyFirebaseToken(token);
  return { isValid: result.valid, error: result.error, actor: result.actor };
}

/**
 * Middleware helper to enforce authentication on API routes
 * Returns error response if authentication fails
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const authCheck = await verifyAuthHeader(request);

  if (!authCheck.isValid) {
    return NextResponse.json(
      { error: authCheck.error || "Unauthorized" },
      { status: 401 },
    );
  }

  return null;
}

/**
 * Like requireAuth(), but hands back the verified actor so the caller can
 * attribute the action in the audit log.
 *
 * Returns either `{ response }` to short-circuit with a 401, or `{ actor }`.
 * Kept separate from requireAuth() so the existing call sites — and the
 * forged-token tests covering them — keep their exact current behaviour.
 */
export async function requireAuthActor(
  request: NextRequest,
): Promise<{ response: NextResponse; actor?: undefined } | { response?: undefined; actor: AuthActor }> {
  const authCheck = await verifyAuthHeader(request);

  if (!authCheck.isValid || !authCheck.actor) {
    return {
      response: NextResponse.json(
        { error: authCheck.error || "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  return { actor: authCheck.actor };
}

/**
 * Verify webhook secret from Authorization header
 * Supports format: Authorization: Bearer <secret>
 */
export function verifyWebhookSecret(request: NextRequest): { isValid: boolean; error?: string } {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return { isValid: false, error: "Missing Authorization header" };
  }

  const [scheme, secret] = authHeader.split(" ");

  if (scheme !== "Bearer") {
    return { isValid: false, error: "Invalid authorization scheme. Use 'Bearer <secret>'" };
  }

  if (!secret) {
    return { isValid: false, error: "Missing webhook secret" };
  }

  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("WEBHOOK_SECRET not configured");
    return { isValid: false, error: "Server configuration error" };
  }

  const isValid = secret === webhookSecret;
  if (!isValid) {
    return { isValid: false, error: "Invalid webhook secret" };
  }

  return { isValid: true };
}

/**
 * Helper to create generic error response (don't expose internal details)
 */
export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}
