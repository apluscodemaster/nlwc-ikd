import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimitMiddleware } from "@/lib/rateLimit";

/**
 * GET /api/quiz/username?name=<name> — `{ available: boolean }`.
 *
 * Powers the live "is this name free?" check while a player picks a name.
 * It used to query the sessions table from the browser; it now answers only
 * yes/no, so it reveals nothing else about other players.
 */
export async function GET(req: NextRequest) {
  const limited = await rateLimitMiddleware(req, "public");
  if (limited) return limited;

  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (name.length < 2 || name.length > 30) {
    return NextResponse.json({ available: false });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("sessions")
    .select("session_id")
    // Escape LIKE wildcards so the check is an exact, case-insensitive match.
    .ilike(
      "username",
      name.replace(/[\\%_]/g, (c) => `\\${c}`),
    )
    .limit(1);

  if (error) {
    console.error("Username availability error:", error);
    return NextResponse.json(
      { error: "Could not check availability" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { available: !data || data.length === 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
