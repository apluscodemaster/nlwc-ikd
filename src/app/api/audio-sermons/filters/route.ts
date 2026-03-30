import { NextRequest, NextResponse } from "next/server";
import {
  getSeriesList,
  getSpeakersList,
  getTopicsList,
} from "@/lib/audioSermons";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");

  try {
    switch (type) {
      case "series": {
        const series = await getSeriesList();
        return NextResponse.json(series, {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=600",
          },
        });
      }
      case "speakers": {
        const speakers = await getSpeakersList();
        return NextResponse.json(speakers, {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=600",
          },
        });
      }
      case "topics": {
        const topics = await getTopicsList();
        return NextResponse.json(topics, {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=600",
          },
        });
      }
      default:
        return NextResponse.json(
          { error: "Invalid filter type. Use: series, speakers, or topics" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Filter options API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: 500 },
    );
  }
}
