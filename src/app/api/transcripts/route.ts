import { NextRequest, NextResponse } from "next/server";
import { getAllTranscripts, getTranscriptsByCategory } from "@/lib/wordpress";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("category") 
      ? parseInt(searchParams.get("category")!)
      : undefined;

    let result;

    if (categoryId) {
      // Fetch by specific category
      result = await getTranscriptsByCategory(categoryId, {
        page,
        perPage,
        search,
      });
    } else {
      // Fetch all transcripts from all categories
      result = await getAllTranscripts({
        page,
        perPage,
        search,
      });
    }

    const { transcripts, totalPages, total } = result;

    return NextResponse.json({
      data: transcripts,
      pagination: {
        page,
        perPage,
        totalPages,
        total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch transcripts:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcripts" },
      { status: 500 },
    );
  }
}
