import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { getSundaySchoolManuals } from "@/lib/wordpress";

export async function GET(request: NextRequest) {
  // Rate limited: proxies WordPress.
  const limited = rateLimitMiddleware(request, "public");
  if (limited) return limited;

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
          // Week's Lesson" hero within ~1 minute. Pairs with the 60s Data Cache
          // window on the underlying WP fetch (getSundaySchoolManuals), so the
          // edge refetch picks up fresh data instead of a stale cache entry.
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
