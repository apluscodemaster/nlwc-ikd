import { NextRequest, NextResponse } from "next/server";
import { getTranscriptBySlug } from "@/lib/wordpress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
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
