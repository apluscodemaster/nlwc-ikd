import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { saveSecurityAnswer } from "@/lib/quizSecurity.server";
import { z } from "zod";

/**
 * Quiz player sessions. The browser used to read and write the `sessions`
 * table directly with the public key, which needed RLS policies letting
 * ANYONE read every row (including every player's session_id — the only
 * credential for their progress) and update any row (e.g. any score). All
 * access now goes through here with the service key, and those policies are
 * removed (supabase/migrations/005_lock_down_quiz_tables.sql).
 */

const usernameSchema = z
  .string()
  .trim()
  .min(2, "Username must be at least 2 characters")
  .max(30, "Username must be under 30 characters");

/** Escape LIKE wildcards so a name like "a_b" matches only itself. */
function exactILike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * GET /api/quiz/session?session_id=<uuid> — the caller's own session (they
 * hold its id). Also bumps last_active.
 */
export async function GET(req: NextRequest) {
  const limited = await rateLimitMiddleware(req, "public");
  if (limited) return limited;

  const parsed = z
    .string()
    .uuid()
    .safeParse(req.nextUrl.searchParams.get("session_id"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .update({ last_active: new Date().toISOString() })
    .eq("session_id", parsed.data)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/quiz/session — body `{ username }`. Creates a new player. The
 * session id is generated here (never accepted from the client, so nobody can
 * claim or overwrite someone else's row). 409 `USERNAME_EXISTS` when the name
 * is taken (case-insensitive).
 */
export async function POST(req: NextRequest) {
  // Creates a player row — throttle so the sessions table can't be flooded.
  const limited = await rateLimitMiddleware(req, "strict");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // `security` is optional so older app versions (name only) keep working;
  // the sign-up forms require it.
  const parsed = z
    .object({
      username: usernameSchema,
      security: z
        .object({
          question: z.string().trim().min(1).max(200),
          answer: z
            .string()
            .max(200)
            .refine((a) => a.trim().length >= 2, {
              message: "Security answer must be at least 2 characters",
            }),
        })
        .optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid data" },
      { status: 400 },
    );
  }
  const username = parsed.data.username;
  const supabase = getSupabaseAdmin();

  const { data: existing, error: checkError } = await supabase
    .from("sessions")
    .select("session_id")
    .ilike("username", exactILike(username))
    .limit(1);

  if (checkError) {
    console.error("Username check error:", checkError);
    return NextResponse.json(
      { error: "Failed to validate username" },
      { status: 500 },
    );
  }
  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Username already taken", code: "USERNAME_EXISTS" },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({ session_id: crypto.randomUUID(), username })
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Username already taken", code: "USERNAME_EXISTS" },
        { status: 409 },
      );
    }
    console.error("Session create error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }

  // Count this as the player's first quiz (as before).
  const { error: rpcError } = await supabase.rpc("increment_quizzes_taken", {
    sid: data.session_id,
  });
  if (rpcError) {
    console.error("Failed to increment quizzes_taken:", rpcError);
  }

  // Save the security question with the profile, so it can be recovered on
  // another device from the start. If this fails the player is still
  // created; the quiz page then offers to set the question.
  let securitySet = false;
  if (parsed.data.security) {
    securitySet = await saveSecurityAnswer(
      data.session_id,
      parsed.data.security.question,
      parsed.data.security.answer,
    );
  }

  return NextResponse.json(
    {
      ...data,
      security_set: securitySet || data.security_set === true,
      quizzes_taken: (data.quizzes_taken ?? 0) + (rpcError ? 0 : 1),
    },
    { status: 201 },
  );
}
