import { NextRequest, NextResponse } from "next/server";
import { getTranscriptBySlug } from "@/lib/wordpress";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Rate limited: each call reaches WordPress / renders an image.
  const limited = await rateLimitMiddleware(
    request,
    "public",
    "/api/transcripts/[slug]",
  );
  if (limited) return limited;

  try {
    const { slug } = await params;
    const transcript = await getTranscriptBySlug(slug);

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: transcript });
  } catch (error) {
    console.error("Failed to fetch transcript:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 },
    );
  }
}
