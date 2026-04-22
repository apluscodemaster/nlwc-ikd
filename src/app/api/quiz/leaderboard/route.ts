import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("leaderboard")
      .select("*")
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
