import { NextRequest, NextResponse } from "next/server";
import { getAdjacentManuals } from "@/lib/wordpress";

export async function GET(request: NextRequest) {
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
