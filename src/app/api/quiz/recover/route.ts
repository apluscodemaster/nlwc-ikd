import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashSecurityAnswer } from "@/lib/quizSecurity.server";
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
 * Returns the security question for a username so the user can answer it.
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

  const { data: sec } = await getSupabaseAdmin()
    .from("session_security")
    .select("question")
    .eq("session_id", session.session_id)
    .maybeSingle();

  if (!sec) {
    return NextResponse.json(
      {
        error:
          "This name has no security question set, so it can't be recovered. Please contact the church admin.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ question: sec.question });
}

/**
 * POST /api/quiz/recover
 * Verify the security answer for a username and, on success, return its
 * session_id so the new device can adopt the existing progress.
 *
 * Body: { username, answer }
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

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer : "";
  if (!username || !answer) {
    return NextResponse.json(
      { error: "Username and answer are required" },
      { status: 400 },
    );
  }

  const session = await findSessionByUsername(username);
  // Generic message on failure to avoid leaking which usernames exist.
  const genericFail = NextResponse.json(
    { error: "Could not verify. Check your name and answer and try again." },
    { status: 401 },
  );
  if (!session) return genericFail;

  const { data: sec } = await getSupabaseAdmin()
    .from("session_security")
    .select("answer_hash")
    .eq("session_id", session.session_id)
    .maybeSingle();
  if (!sec) return genericFail;

  if (hashSecurityAnswer(answer) !== sec.answer_hash) return genericFail;

  return NextResponse.json({
    session_id: session.session_id,
    username: session.username,
  });
}
