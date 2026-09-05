import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { getSundaySchoolManuals } from "@/lib/wordpress";

// Buffer is used to build the WP Basic-auth header below.
export const runtime = "nodejs";

/**
 * Basic-auth header so the public listing can also read SCHEDULED manuals.
 *
 * The credentials never leave the server: the listing renders scheduled
 * manuals greyed out and unclickable, and their body is dropped by
 * `transformToManualListing` (content: ""), so nothing unreleased is served.
 */
function getManualsAuth(): string | undefined {
  const user = process.env.WP_APPLICATION_USER || "admin";
  const pass = process.env.WP_APPLICATION_PASSWORD || "";
  if (!pass) return undefined;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export async function GET(request: NextRequest) {
  // Rate limited: proxies WordPress.
  const limited = rateLimitMiddleware(request, "public");
  if (limited) return limited;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");
    const search = searchParams.get("search") || undefined;

    // Scheduled manuals ride along with the published ones so the listing can
    // show what's coming. WordPress orders date-desc, so their future dates put
    // them at the top of the grid.
    const authHeader = getManualsAuth();

    let result;
    try {
      result = await getSundaySchoolManuals({
        page,
        perPage,
        search,
        status: authHeader ? "publish,future" : undefined,
        authHeader,
      });
    } catch (error) {
      // Bad/expired WP credentials make the authenticated query fail outright.
      // The listing matters more than the scheduled previews, so fall back to
      // published-only rather than 500-ing the whole page.
      if (!authHeader) throw error;
      console.error(
        "Manuals: scheduled-post query failed, falling back to published only:",
        error,
      );
      result = await getSundaySchoolManuals({ page, perPage, search });
    }

    const { manuals, totalPages, total } = result;

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
