import { NextRequest, NextResponse } from "next/server";
import { getSundayMessageTranscripts } from "@/lib/wordpress";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");
    const search = searchParams.get("search") || undefined;

    const { transcripts, totalPages, total } =
      await getSundayMessageTranscripts({
        page,
        perPage,
        search,
      });

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
