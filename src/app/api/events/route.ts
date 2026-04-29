import { NextResponse, NextRequest } from "next/server";
import { getUpcomingEvents } from "@/data/events";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  // Apply rate limiting to public endpoint
  const rateLimitError = rateLimitMiddleware(request, "public");
  if (rateLimitError) {
    return rateLimitError;
  }

  const response = NextResponse.json(getUpcomingEvents());
  // Cache events for 1 hour
  response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
  return response;
}
