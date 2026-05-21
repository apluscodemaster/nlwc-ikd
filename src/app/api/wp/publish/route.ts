import { NextResponse, NextRequest } from "next/server";
import { wpPublishSchema } from "@/types/wp-types";
import { publishToWordPress } from "@/services/wp-service";
import { requireAuth } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";

/**
 * POST /api/wp/publish
 *
 * Accepts a JSON body matching one of the WP content schemas,
 * validates it, and publishes to WordPress.
 *
 * Requires authentication via Authorization header: Bearer <Firebase ID token>
 *
 * After a successful publish the relevant Next.js cached paths are
 * revalidated so the frontend and admin list reflect the new content
 * immediately instead of waiting for the ISR window to expire.
 */
export async function POST(request: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const authError = requireAuth(request);
  if (authError) {
    return authError;
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
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

    // ── Validate with Zod ─────────────────────────────────────────────────
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

    // ── Publish to WordPress ──────────────────────────────────────────────
    const result = await publishToWordPress(parsed.data, { featuredMediaId });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // ── Bust Next.js cache so admin list + public pages update immediately ─
    // revalidatePath is called after a confirmed successful write only.
    try {
      const type = parsed.data.type;

      // Always revalidate the admin list
      revalidatePath("/admin");

      if (type === "sermon") {
        revalidatePath("/sermons");
        revalidatePath("/sermons/audio/[id]", "page");
      } else if (type === "transcript") {
        revalidatePath("/transcripts");
        revalidatePath("/transcripts/[slug]", "page");
        // Sermon listing page also surfaces transcripts
        revalidatePath("/sermons");
      } else if (type === "manual") {
        revalidatePath("/manuals");
        revalidatePath("/manuals/[slug]", "page");
      }
    } catch {
      // revalidatePath can throw in certain runtime contexts — never fail
      // the response because of a cache-busting error.
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
