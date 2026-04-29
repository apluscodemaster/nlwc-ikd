import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyWebhookSecret } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";

/**
 * On-demand revalidation endpoint
 *
 * Allows manual triggering of ISR revalidation for faster updates
 *
 * Usage:
 * POST /api/revalidate?path=/transcripts
 * Headers: Authorization: Bearer <WEBHOOK_SECRET>
 *
 * The secret must match WEBHOOK_SECRET environment variable for security
 *
 * ⚠️ BREAKING CHANGE: Secret now passed in Authorization header, not query param
 * This prevents secrets from being logged in browser history and server logs
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (strict for revalidation)
  const rateLimitError = rateLimitMiddleware(request, "strict");
  if (rateLimitError) {
    return rateLimitError;
  }

  // Verify webhook secret from Authorization header
  const secretCheck = verifyWebhookSecret(request);
  if (!secretCheck.isValid) {
    return NextResponse.json(
      { error: secretCheck.error || "Unauthorized" },
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
