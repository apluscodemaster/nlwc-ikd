import { NextRequest, NextResponse } from "next/server";
import { getAudioSermons, getAudioSermonDetail } from "@/lib/audioSermons";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { normalizeSearchQuery } from "@/lib/utils";

export async function GET(request: NextRequest) {
  // Apply rate limiting to public endpoint
  const rateLimitError = rateLimitMiddleware(request, "public");
  if (rateLimitError) {
    return rateLimitError;
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  let perPage = parseInt(searchParams.get("per_page") || "12");
  const messageId = searchParams.get("message_id");
  let search = searchParams.get("search") || undefined;
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

  // Normalize search query to handle punctuation variations
  if (search) {
    search = normalizeSearchQuery(search);
  }

  // Validate pagination parameters
  if (page < 1) {
    return NextResponse.json({ error: "Page must be >= 1" }, { status: 400 });
  }

  // Enforce max page size to prevent performance issues
  perPage = Math.min(Math.max(perPage, 1), 100);

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

      // Add cache headers for successful responses
      const response = NextResponse.json(sermon);
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=600",
      );
      return response;
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
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Audio sermons API error:", {
      message: errorMessage,
      page,
      perPage,
      search,
      seriesId,
      speakerId,
      topicId,
      order,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch audio sermons",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
