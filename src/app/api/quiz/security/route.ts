import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashSecurityAnswer } from "@/lib/quizSecurity.server";
import { SELF_RESET_COOLDOWN_DAYS } from "@/lib/quizSecurity";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * POST /api/quiz/security
 * Set or change the security question that lets a user recover their quiz
 * progress on another device. Changing an existing question is limited to once
 * every SELF_RESET_COOLDOWN_DAYS days (admins can reset anytime — see
 * /api/quiz/admin/security-reset).
 *
 * Body: { session_id, question, answer }
 */
export async function POST(req: NextRequest) {
  const limited = rateLimitMiddleware(req, "authenticated");
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer : "";

  if (!sessionId || !question || answer.trim().length < 2) {
    return NextResponse.json(
      { error: "Provide a question and an answer of at least 2 characters." },
      { status: 400 },
    );
  }

  const db = getSupabaseAdmin();

  // The session must exist.
  const { data: session } = await db
    .from("sessions")
    .select("session_id")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // If a question already exists, enforce the self-change cooldown.
  const { data: existing } = await db
    .from("session_security")
    .select("updated_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing?.updated_at) {
    const lastMs = new Date(existing.updated_at).getTime();
    const daysSince = (Date.now() - lastMs) / 86_400_000;
    if (daysSince < SELF_RESET_COOLDOWN_DAYS) {
      const nextDate = new Date(
        lastMs + SELF_RESET_COOLDOWN_DAYS * 86_400_000,
      );
      return NextResponse.json(
        {
          error: `You can change your security question once every ${SELF_RESET_COOLDOWN_DAYS} days. Try again on ${nextDate.toDateString()}, or ask an admin to reset it.`,
        },
        { status: 429 },
      );
    }
  }

  const { error: upErr } = await db.from("session_security").upsert(
    {
      session_id: sessionId,
      question,
      answer_hash: hashSecurityAnswer(answer),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );
  if (upErr) {
    console.error("security upsert error:", upErr);
    return NextResponse.json(
      { error: "Failed to save security question" },
      { status: 500 },
    );
  }

  // Public, non-sensitive flag so the client knows recovery is configured.
  await db
    .from("sessions")
    .update({ security_set: true })
    .eq("session_id", sessionId);

  return NextResponse.json({ success: true });
}
