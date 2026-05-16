import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/quizService";
import type { WeakArea } from "@/types/quiz";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sermonRef = searchParams.get("sermon_ref") || undefined;
    const category = searchParams.get("category") || undefined;

    // Get recommendations based on sermon reference
    const refs = sermonRef
      ? [{ slug: sermonRef, category: category || "" }]
      : [];

    // Create a simple weak area if we have a category
    const weakAreas: WeakArea[] = category
      ? [
          {
            category: category as any,
            wrong_count: 1,
            total_count: 1,
            fail_rate: 100,
          },
        ]
      : [];

    const recommendations = await getRecommendations(weakAreas, refs);

    return NextResponse.json(recommendations, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 },
    );
  }
}
