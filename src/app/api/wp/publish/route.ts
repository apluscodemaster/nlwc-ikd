import { NextResponse, NextRequest } from "next/server";
import { wpPublishSchema } from "@/types/wp-types";
import { publishToWordPress } from "@/services/wp-service";
import { requireAuth } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";

/**
 * POST /api/wp/publish
 *
 * Accepts a JSON body matching one of the WP content schemas,
 * validates it, and publishes to WordPress.
 *
 * Requires authentication via Authorization header: Bearer <ADMIN_API_KEY>
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  // Apply rate limiting
  const rateLimitError = rateLimitMiddleware(request, "authenticated");
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = await request.json();

    // Extract featured media ID before validation (not part of schema)
    const featuredMediaId = body.featuredMediaId
      ? Number(body.featuredMediaId)
      : undefined;

    // Validate with Zod
    const parsed = wpPublishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    // Publish to WordPress
    const result = await publishToWordPress(parsed.data, { featuredMediaId });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
