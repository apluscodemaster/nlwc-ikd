import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/quiz/leaderboard — top players.
 *
 * Read with the service key (the quiz tables no longer allow public reads)
 * and returns only public fields. It used to return each player's session_id,
 * which is the only credential for their progress — anyone could then submit
 * answers or restore progress as them.
 */
export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("leaderboard")
      .select("username, total_score, quizzes_taken, last_active")
      .limit(100);

    if (error) {
      console.error("Leaderboard fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: 500 },
      );
    }

    return NextResponse.json(data || [], {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
