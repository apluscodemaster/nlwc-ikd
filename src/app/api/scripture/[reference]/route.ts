import { NextRequest, NextResponse } from "next/server";
import { fetchBibleVerse } from "@/lib/bible-api";

/**
 * API route to fetch Bible verses
 * Bypasses CORS issues by routing requests through the server
 */
export async function GET(request: NextRequest) {
  try {
    const { reference } = await props.params;

    if (!reference) {
      return NextResponse.json(
        { error: "Reference parameter is required" },
        { status: 400 },
      );
    }

    // Decode the reference
    const decodedReference = decodeURIComponent(reference);

    // Fetch the verse
    const verse = await fetchBibleVerse(decodedReference);

    if (!verse) {
      return NextResponse.json(
        { error: "Scripture reference not found" },
        { status: 404 },
      );
    }

    // Return with cache headers (24 hour cache)
    return NextResponse.json(verse, {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching scripture:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripture reference" },
      { status: 500 },
    );
  }
}
