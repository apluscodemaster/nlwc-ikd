import { NextResponse } from "next/server";
import { wpPublishSchema } from "@/types/wp-types";
import { publishToWordPress } from "@/services/wp-service";

/**
 * POST /api/wp/publish
 *
 * Accepts a JSON body matching one of the WP content schemas,
 * validates it, and publishes to WordPress.
 */
export async function POST(request: Request) {
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
