import { NextResponse, NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { getVideoMessages, type VideoMessage } from "@/lib/videoMessages";

export type { VideoMessage };

export async function GET(request: NextRequest) {
  // Apply rate limiting to public endpoint
  const rateLimitError = rateLimitMiddleware(request, "public");
  if (rateLimitError) {
    return rateLimitError;
  }

  if (!process.env.GOOGLE_SHEETS_ID) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const messages = await getVideoMessages();

    const response = NextResponse.json({ messages });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=600",
    );
    return response;
  } catch (err: unknown) {
    console.error("Video Messages API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch video messages" },
      { status: 500 },
    );
  }
}
