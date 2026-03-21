import { NextRequest, NextResponse } from "next/server";
import { getSpeakersList, getSeriesList } from "@/lib/audioSermons";

/**
 * GET /api/wp/speakers?type=speakers|series
 *
 * Fetches the list of speakers/ministers or sermon series from WordPress
 * for use in the admin dropdowns.
 */
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "speakers";

  try {
    if (type === "series") {
      const series = await getSeriesList();
      return NextResponse.json(
        { series },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=600",
          },
        },
      );
    }

    // Default: speakers
    const speakers = await getSpeakersList();
    return NextResponse.json(
      { speakers },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error(`Failed to fetch ${type}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${type}`, [type]: [] },
      { status: 500 },
    );
  }
}
