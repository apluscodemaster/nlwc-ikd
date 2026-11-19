// Server-only: imported exclusively by quiz API routes (never by client code).
import { createHmac } from "crypto";
import { normalizeSecurityAnswer } from "./quizSecurity";
import { getSupabaseAdmin } from "./supabase";

// Server-side pepper for hashing security answers. Falls back to WEBHOOK_SECRET
// so the feature works without extra config, but a dedicated value is best.
const PEPPER =
  process.env.QUIZ_SECURITY_PEPPER ||
  process.env.WEBHOOK_SECRET ||
  "nlwc-quiz-security-fallback-pepper";

/** Hash a security answer (HMAC-SHA256 over the normalised answer + pepper). */
export function hashSecurityAnswer(answer: string): string {
  return createHmac("sha256", PEPPER)
    .update(normalizeSecurityAnswer(answer))
    .digest("hex");
}

/**
 * Store a player's security question and hashed answer, and set the public
 * `security_set` flag. Shared by sign-up (/api/quiz/session) and
 * /api/quiz/security. Returns false when the write failed.
 */
export async function saveSecurityAnswer(
  sessionId: string,
  question: string,
  answer: string,
): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("session_security").upsert(
    {
      session_id: sessionId,
      question,
      answer_hash: hashSecurityAnswer(answer),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );
  if (error) {
    console.error("security upsert error:", error);
    return false;
  }
  await db
    .from("sessions")
    .update({ security_set: true })
    .eq("session_id", sessionId);
  return true;
}
