import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * POST /api/quiz/admin/security-reset
 * Admin escape hatch: clears a user's security question so they can set a new
 * one (bypasses the 30-day self-change cooldown). Used when a user is locked
 * out. Protected by the auth-gated admin dashboard + rate limiting, matching
 * the other /api/quiz/admin/* routes.
 *
 * Body: { session_id }
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
  if (!sessionId) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 },
    );
  }

  const db = getSupabaseAdmin();

  const { error: delErr } = await db
    .from("session_security")
    .delete()
    .eq("session_id", sessionId);
  if (delErr) {
    console.error("security-reset delete error:", delErr);
    return NextResponse.json(
      { error: "Failed to reset security question" },
      { status: 500 },
    );
  }

  await db
    .from("sessions")
    .update({ security_set: false })
    .eq("session_id", sessionId);

  return NextResponse.json({ success: true });
}
