import { NextResponse, NextRequest } from "next/server";
import { wpPublishSchema } from "@/types/wp-types";
import { publishToWordPress } from "@/services/wp-service";
import { requireAuth } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";

/**
 * Safely call revalidatePath without crashing in dev/Turbopack.
 * revalidatePath can throw outside of a rendering context, or under
 * Turbopack in development. We never want that to turn a successful
 * publish into a 500.
 */
async function safeRevalidate(paths: string[]) {
  try {
    const { revalidatePath } = await import("next/cache");
    for (const p of paths) {
      try {
        revalidatePath(p);
      } catch {
        // individual path failure is non-fatal
      }
    }
  } catch {
    // next/cache unavailable in this runtime context — safe to skip
  }
}

/**
 * POST /api/wp/publish
 *
 * Accepts a JSON body matching one of the WP content schemas,
 * validates it, and publishes to WordPress.
 *
 * Requires: Authorization: Bearer <Firebase ID token>
 *
 * Changes from original:
 *  1. safeRevalidate() replaces the bare revalidatePath() calls so a
 *     cache-bust failure in dev/Turbopack never turns a successful
 *     publish into a 500.
 */
export async function POST(request: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const authError = await requireAuth(request);
  if (authError) return authError;

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rateLimitError = rateLimitMiddleware(request, "authenticated");
  if (rateLimitError) return rateLimitError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // Extract featured media ID before Zod validation (not part of schema)
  const featuredMediaId = body.featuredMediaId
    ? Number(body.featuredMediaId)
    : undefined;

  // Optional publish date (YYYY-MM-DDTHH:mm:00). A future value combined with
  // status "publish" makes WordPress schedule the post (status "future").
  const date =
    typeof body.date === "string" && body.date.trim() ? body.date : undefined;

  // ── Zod validation ────────────────────────────────────────────────────────
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

  // ── Publish to WordPress ──────────────────────────────────────────────────
  const result = await publishToWordPress(parsed.data, { featuredMediaId, date });

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  // ── Bust Next.js cache (best-effort) ──────────────────────────────────────
  const type = parsed.data.type;
  const paths = ["/admin"];
  if (type === "sermon") {
    paths.push("/sermons", "/sermons/audio/[id]");
  } else if (type === "transcript") {
    paths.push("/transcripts", "/transcripts/[slug]", "/sermons");
  } else if (type === "manual") {
    paths.push("/manuals", "/manuals/[slug]");
  }
  await safeRevalidate(paths);

  return NextResponse.json(result, { status: 201 });
}
