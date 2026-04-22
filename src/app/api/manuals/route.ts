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
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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
