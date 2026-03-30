import { NextRequest, NextResponse } from "next/server";
import { getAudioSermons, getAudioSermonDetail } from "@/lib/audioSermons";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "12");
  const messageId = searchParams.get("message_id");
  const search = searchParams.get("search") || undefined;
  const seriesId = searchParams.get("series_id")
    ? parseInt(searchParams.get("series_id")!)
    : undefined;
  const speakerId = searchParams.get("speaker_id")
    ? parseInt(searchParams.get("speaker_id")!)
    : undefined;
  const topicId = searchParams.get("topic_id")
    ? parseInt(searchParams.get("topic_id")!)
    : undefined;
  const order = (searchParams.get("order") as "ASC" | "DESC") || "DESC";

  try {
    // If a specific message ID is requested, return its details
    if (messageId) {
      const sermon = await getAudioSermonDetail(parseInt(messageId));
      if (!sermon) {
        return NextResponse.json(
          { error: "Sermon not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(sermon);
    }

    // Otherwise, return the paginated listing with optional filters
    const data = await getAudioSermons({
      page,
      perPage,
      search,
      seriesId,
      speakerId,
      topicId,
      order,
    });

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Audio sermons API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audio sermons" },
      { status: 500 },
    );
  }
}
