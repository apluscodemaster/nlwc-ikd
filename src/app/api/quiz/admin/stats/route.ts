import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// ── GET: Quiz stats for admin dashboard ──
export async function GET() {
  try {
    const supabase = getSupabase();

    // Fetch sessions count and aggregate stats
    const { data: sessions, error: sessErr } = await supabase
      .from("sessions")
      .select(
        "session_id, username, total_score, quizzes_taken, last_active, created_at",
      );

    if (sessErr) {
      console.error("Sessions fetch error:", sessErr);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 },
      );
    }

    // Fetch attempts aggregate by category
    const { data: attempts, error: attErr } = await supabase
      .from("quiz_attempts")
      .select("category, is_correct");

    if (attErr) {
      console.error("Attempts fetch error:", attErr);
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 },
      );
    }

    // Build category breakdown
    const categoryStats: Record<string, { total: number; correct: number }> =
      {};
    for (const a of attempts || []) {
      if (!categoryStats[a.category]) {
        categoryStats[a.category] = { total: 0, correct: 0 };
      }
      categoryStats[a.category].total++;
      if (a.is_correct) categoryStats[a.category].correct++;
    }

    const totalPlayers = sessions?.length || 0;
    const totalQuizzesTaken =
      sessions?.reduce((s, r) => s + (r.quizzes_taken || 0), 0) || 0;
    const totalAttempts = attempts?.length || 0;
    const totalCorrect = attempts?.filter((a) => a.is_correct).length || 0;

    // Recent sessions (last 20)
    const recentSessions = (sessions || [])
      .sort(
        (a, b) =>
          new Date(b.last_active).getTime() - new Date(a.last_active).getTime(),
      )
      .slice(0, 20);

    return NextResponse.json({
      totalPlayers,
      totalQuizzesTaken,
      totalAttempts,
      totalCorrect,
      avgScore:
        totalAttempts > 0
          ? Math.round((totalCorrect / totalAttempts) * 100)
          : 0,
      categoryStats,
      recentSessions,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 },
    );
  }
}
