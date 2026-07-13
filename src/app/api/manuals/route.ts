import { NextRequest, NextResponse } from "next/server";
import { getSundaySchoolManuals } from "@/lib/wordpress";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");
    const search = searchParams.get("search") || undefined;

    const { manuals, totalPages, total } = await getSundaySchoolManuals({
      page,
      perPage,
      search,
    });

    return NextResponse.json(
      {
        data: manuals,
        pagination: {
          page,
          perPage,
          totalPages,
          total,
        },
      },
      {
        headers: {
          // Short edge window so a newly published manual reaches the "This
          // Week's Lesson" hero within ~1 minute. The underlying WP fetch is
          // tagged ("manuals") and revalidated on publish/update, so the edge
          // refetch picks up fresh data rather than a stale Data Cache entry.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch manuals:", error);
    return NextResponse.json(
      { error: "Failed to fetch manuals" },
      { status: 500 },
    );
  }
}
