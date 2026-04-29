import { NextRequest, NextResponse } from "next/server";
import { getMessageTranscripts } from "@/lib/wordpress";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  // Apply rate limiting to public endpoint
  const rateLimitError = rateLimitMiddleware(request, "public");
  if (rateLimitError) {
    return rateLimitError;
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  let perPage = parseInt(searchParams.get("per_page") || "9");
  const search = searchParams.get("search") || undefined;

  // Validate pagination parameters
  if (page < 1) {
    return NextResponse.json({ error: "Page must be >= 1" }, { status: 400 });
  }

  // Enforce max page size
  perPage = Math.min(Math.max(perPage, 1), 100);

  try {
    const data = await getMessageTranscripts({
      page,
      perPage,
      search,
    });

    // Transform transcripts to sermon format for the SermonsList component
    const sermons = data.transcripts.map((transcript) => ({
      id: transcript.id,
      title: transcript.title,
      speaker: transcript.speaker || "NLWC Ikorodu",
      date: transcript.formattedDate,
      slug: transcript.slug,
      excerpt: transcript.excerpt,
      thumbnail: transcript.thumbnail || "/default-sermon.webp",
      type: transcript.type,
      link: `/sermons/${transcript.slug}`,
    }));

    const response = NextResponse.json(
      {
        sermons,
        pagination: {
          page,
          perPage,
          total: data.total,
          totalPages: data.totalPages,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching sermons:", error);
    return NextResponse.json(
      { error: "Failed to fetch sermons" },
      { status: 500 },
    );
  }
}
