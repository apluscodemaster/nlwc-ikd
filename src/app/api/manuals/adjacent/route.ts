import { NextRequest, NextResponse } from "next/server";
import { getAdjacentManuals } from "@/lib/wordpress";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  // Rate limited: each call reaches WordPress / renders an image.
  const limited = await rateLimitMiddleware(request, "public");
  if (limited) return limited;

  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const slug = searchParams.get("slug");

    if (!date || !slug) {
      return NextResponse.json(
        { error: "date and slug are required" },
        { status: 400 },
      );
    }

    const result = await getAdjacentManuals(date, slug);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch adjacent manuals:", error);
    return NextResponse.json(
      { error: "Failed to fetch adjacent manuals" },
      { status: 500 },
    );
  }
}
