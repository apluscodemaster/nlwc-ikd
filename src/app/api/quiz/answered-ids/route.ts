import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const session_id = searchParams.get("session_id");
    const category = searchParams.get("category");

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 },
      );
    }

    let query = getSupabase()
      .from("quiz_attempts")
      .select("question_id")
      .eq("session_id", session_id);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch answered IDs:", error);
      return NextResponse.json(
        { error: "Failed to fetch answered IDs" },
        { status: 500 },
      );
    }

    // Return distinct question_id values as a flat array
    const answeredIds = [
      ...new Set((data ?? []).map((row: any) => row.question_id)),
    ];

    return NextResponse.json(answeredIds, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Answered IDs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch answered IDs" },
      { status: 500 },
    );
  }
}
