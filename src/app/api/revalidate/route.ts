import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * On-demand revalidation endpoint
 *
 * Allows manual triggering of ISR revalidation for faster updates
 *
 * Usage:
 * - POST /api/revalidate?path=/transcripts&secret=<WEBHOOK_SECRET>
 * - POST /api/revalidate?tag=transcripts&secret=<WEBHOOK_SECRET>
 *
 * The secret must match WEBHOOK_SECRET environment variable for security
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.nextUrl.searchParams.get("secret");
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!secret || !webhookSecret || secret !== webhookSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing secret" },
      { status: 401 },
    );
  }

  try {
    const path = request.nextUrl.searchParams.get("path");
    const tag = request.nextUrl.searchParams.get("tag");

    if (!path && !tag) {
      return NextResponse.json(
        { error: "Must provide either 'path' or 'tag' parameter" },
        { status: 400 },
      );
    }

    const results = [];

    // Revalidate specific path
    if (path) {
      revalidatePath(path);
      results.push(`Revalidated path: ${path}`);
      console.log(`[Revalidate] Path: ${path}`);
    }

    // Revalidate by tag
    if (tag) {
      // Note: Tag-based revalidation requires configuring fetch with tags
      // For now, we recommend using path-based revalidation
      results.push(`Tag parameter noted: ${tag} (use path parameter for immediate revalidation)`);
      console.log(`[Revalidate] Tag requested: ${tag}`);
    }

    return NextResponse.json(
      {
        message: "Revalidation successful",
        results,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      {
        error: "Revalidation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for quick health check or to test revalidation
 * Usage: GET /api/revalidate?check=true
 */
export async function GET(request: NextRequest) {
  const check = request.nextUrl.searchParams.get("check");

  if (check === "true") {
    return NextResponse.json(
      {
        status: "healthy",
        message:
          "Revalidation endpoint is working. Use POST with secret parameter to revalidate.",
        endpoints: {
          POST: {
            description: "Trigger on-demand revalidation",
            parameters: {
              secret: "Webhook secret (required)",
              path: "Path to revalidate (e.g. /transcripts)",
              tag: "Tag to revalidate (e.g. transcripts)",
            },
            example:
              "POST /api/revalidate?secret=YOUR_SECRET&path=/transcripts",
          },
        },
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      error: "Use POST to revalidate or GET with ?check=true for health check",
    },
    { status: 405, statusText: "Method Not Allowed" },
  );
}
