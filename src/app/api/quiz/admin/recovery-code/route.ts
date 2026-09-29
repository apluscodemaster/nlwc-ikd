import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { requireAuthActor } from "@/lib/auth";
import { recordAudit } from "@/lib/auditLog";
import { issueRecoveryCode, buildRecoveryLink } from "@/lib/quizRecovery.server";
import { RECOVERY_CODE_TTL_HOURS, formatRecoveryCode } from "@/lib/quizSecurity";

export const runtime = "nodejs";

/**
 * POST /api/quiz/admin/recovery-code
 * Issue a single-use recovery code (and a signed link carrying the same code)
 * for a player who is locked out of their progress — e.g. one who chose a name
 * before security questions existed, or who forgot their answer. Redeeming it
 * adopts the session on the new device and clears any old security question so
 * the player can set a fresh one immediately.
 *
 * The plaintext code is returned ONCE here and shown to the admin; only its
 * hash is stored. Issuing again replaces any earlier code for the player.
 *
 * Requires a valid admin token. Body: { session_id }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthActor(req);
  if (auth.response) return auth.response;

  const limited = rateLimitMiddleware(req, "authenticated");
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sessionId = typeof body.session_id === "string" ? body.session_id : "";
  if (!sessionId) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 },
    );
  }

  const { data: session } = await getSupabaseAdmin()
    .from("sessions")
    .select("session_id, username")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  try {
    const issued = await issueRecoveryCode(sessionId, auth.actor.email ?? null);

    void recordAudit({
      actor: auth.actor,
      action: "create",
      resource: "quiz-stats",
      target: `Recovery code for ${session.username}`,
      targetId: sessionId,
      detail: { expiresAt: issued.expiresAt },
      request: req,
    });

    return NextResponse.json({
      username: session.username,
      code: formatRecoveryCode(issued.code),
      link: buildRecoveryLink(req.nextUrl.origin, issued.token),
      expiresAt: issued.expiresAt,
      ttlHours: RECOVERY_CODE_TTL_HOURS,
    });
  } catch (err) {
    console.error("recovery-code issue error:", err);
    return NextResponse.json(
      { error: "Failed to issue recovery code" },
      { status: 500 },
    );
  }
}
