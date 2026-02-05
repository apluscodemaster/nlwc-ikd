import { NextRequest, NextResponse } from "next/server";
import { getSundayMessageTranscripts } from "@/lib/wordpress";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "9");
  const search = searchParams.get("search") || undefined;

  try {
    const data = await getSundayMessageTranscripts({
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
      type: transcript.type, // sunday-message or sunday-school
      link: `/transcripts/${transcript.slug}`,
    }));

    return NextResponse.json({
      sermons,
      pagination: {
        page,
        perPage,
        total: data.total,
        totalPages: data.totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching sermons:", error);
    return NextResponse.json(
      { error: "Failed to fetch sermons" },
      { status: 500 },
    );
  }
}
