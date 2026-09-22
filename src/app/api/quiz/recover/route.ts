import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashSecurityAnswer } from "@/lib/quizSecurity.server";
import {
  hasActiveRecoveryCode,
  redeemRecoveryCode,
  verifyClaimToken,
} from "@/lib/quizRecovery.server";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Resolve a username to its (most recently active) session.
async function findSessionByUsername(username: string) {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("sessions")
    .select("session_id, username")
    .ilike("username", username)
    .order("last_active", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

/**
 * GET /api/quiz/recover?username=...
 * Tells the client how this name can be recovered:
 *   { question }                       — answer the security question
 *   { question, hasRecoveryCode: true} — either that, or an admin-issued code
 *   { question: null, hasRecoveryCode: true } — code only (no question set)
 * 404 when neither exists — the message says to ask the admin for a code.
 */
export async function GET(req: NextRequest) {
  const limited = rateLimitMiddleware(req, "authenticated");
  if (limited) return limited;

  const username = (req.nextUrl.searchParams.get("username") || "").trim();
  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const session = await findSessionByUsername(username);
  if (!session) {
    return NextResponse.json(
      { error: "No recoverable progress found for that name." },
      { status: 404 },
    );
  }

  const [{ data: sec }, hasRecoveryCode] = await Promise.all([
    getSupabaseAdmin()
      .from("session_security")
      .select("question")
      .eq("session_id", session.session_id)
      .maybeSingle(),
    hasActiveRecoveryCode(session.session_id),
  ]);

  if (!sec && !hasRecoveryCode) {
    return NextResponse.json(
      {
        error:
          "This name has no security question set. Ask the church admin for a recovery code — it lets you continue with your score and set a question.",
        needsAdminCode: true,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    question: sec?.question ?? null,
    hasRecoveryCode,
  });
}

/**
 * POST /api/quiz/recover
 * Verify one of three credentials and, on success, return the session_id so
 * the new device can adopt the existing progress:
 *   { username, answer } — security question answer
 *   { username, code }   — admin-issued recovery code
 *   { token }            — signed recovery link (carries the same code)
 *
 * Redeeming a code/link also clears the old security question, so the reply
 * carries `mustSetSecurity: true` and the client prompts for a fresh one.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimitMiddleware(req, "strict");
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Generic message on failure to avoid leaking which usernames exist.
  const genericFail = NextResponse.json(
    { error: "Could not verify. Check your details and try again." },
    { status: 401 },
  );
  const db = getSupabaseAdmin();

  // ── Signed link ────────────────────────────────────────────────────────
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (token) {
    const claim = verifyClaimToken(token);
    if (!claim) {
      return NextResponse.json(
        { error: "This recovery link is invalid or has expired. Ask the admin for a new one." },
        { status: 401 },
      );
    }
    const { data: session } = await db
      .from("sessions")
      .select("session_id, username")
      .eq("session_id", claim.sid)
      .maybeSingle();
    if (!session) return genericFail;
    if (!(await redeemRecoveryCode(session.session_id, claim.code))) {
      return NextResponse.json(
        { error: "This recovery link has already been used or has expired. Ask the admin for a new one." },
        { status: 401 },
      );
    }
    return NextResponse.json({
      session_id: session.session_id,
      username: session.username,
      mustSetSecurity: true,
    });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!username || (!answer && !code)) {
    return NextResponse.json(
      { error: "Username and an answer or recovery code are required" },
      { status: 400 },
    );
  }

  const session = await findSessionByUsername(username);
  if (!session) return genericFail;

  // ── Admin-issued code ──────────────────────────────────────────────────
  if (code) {
    if (!(await redeemRecoveryCode(session.session_id, code))) return genericFail;
    return NextResponse.json({
      session_id: session.session_id,
      username: session.username,
      mustSetSecurity: true,
    });
  }

  // ── Security question ──────────────────────────────────────────────────
  const { data: sec } = await db
    .from("session_security")
    .select("answer_hash")
    .eq("session_id", session.session_id)
    .maybeSingle();
  if (!sec) return genericFail;

  if (hashSecurityAnswer(answer) !== sec.answer_hash) return genericFail;

  return NextResponse.json({
    session_id: session.session_id,
    username: session.username,
    mustSetSecurity: false,
  });
}
