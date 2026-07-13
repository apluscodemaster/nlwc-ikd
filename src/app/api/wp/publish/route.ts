import { NextResponse, NextRequest } from "next/server";
import { wpPublishSchema, wpSermonCreateSchema } from "@/types/wp-types";
import {
  publishToWordPress,
  createSermonInSeriesEngine,
} from "@/services/wp-service";
import { requireAuth } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";

/**
 * Safely call revalidatePath without crashing in dev/Turbopack.
 * revalidatePath can throw outside of a rendering context, or under
 * Turbopack in development. We never want that to turn a successful
 * publish into a 500.
 */
async function safeRevalidate(
  targets: Array<{ path: string; kind?: "page" | "layout" }>,
) {
  try {
    const { revalidatePath } = await import("next/cache");
    for (const t of targets) {
      try {
        // Dynamic detail routes ("/manuals/[slug]", "/sermons/audio/[id]") must
        // be revalidated with the "page" kind so every cached instance — not
        // just the literal path — is refreshed.
        if (t.kind) revalidatePath(t.path, t.kind);
        else revalidatePath(t.path);
      } catch {
        // individual path failure is non-fatal
      }
    }
  } catch {
    // next/cache unavailable in this runtime context — safe to skip
  }
}

/** Bust tagged Data Cache entries (e.g. the "manuals" listing fetch). */
async function safeRevalidateTags(tags: string[]) {
  try {
    const { revalidateTag } = await import("next/cache");
    for (const t of tags) {
      try {
        revalidateTag(t);
      } catch {
        // individual tag failure is non-fatal
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

  // ── Sermons: Series Engine, not a WordPress post ──────────────────────────
  // Audio sermons live in the Series Engine DB and reference an S3-hosted MP3
  // by URL. They take a completely different backend path from transcripts and
  // manuals (which are WP posts), so branch before the WP-post publish logic.
  if (body.type === "sermon") {
    const parsedSermon = wpSermonCreateSchema.safeParse(body);
    if (!parsedSermon.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsedSermon.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const sermonResult = await createSermonInSeriesEngine(parsedSermon.data);
    if (!sermonResult.success) {
      return NextResponse.json(sermonResult, { status: 500 });
    }

    await safeRevalidate([
      { path: "/admin/content" },
      { path: "/sermons" },
      { path: "/sermons/audio/[id]", kind: "page" },
    ]);
    return NextResponse.json(sermonResult, { status: 201 });
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
  const targets: Array<{ path: string; kind?: "page" | "layout" }> = [
    { path: "/admin/content" },
  ];
  if (type === "sermon") {
    targets.push(
      { path: "/sermons" },
      { path: "/sermons/audio/[id]", kind: "page" },
    );
  } else if (type === "transcript") {
    targets.push(
      { path: "/transcripts" },
      { path: "/transcripts/[slug]", kind: "page" },
      { path: "/sermons" },
    );
  } else if (type === "manual") {
    targets.push(
      { path: "/manuals" },
      { path: "/manuals/[slug]", kind: "page" },
    );
  }
  await safeRevalidate(targets);
  // The manuals listing (client-fetched via /api/manuals) reads a tagged WP
  // fetch — bust it so the new manual reaches the "This Week's Lesson" hero.
  if (type === "manual") await safeRevalidateTags(["manuals"]);

  return NextResponse.json(result, { status: 201 });
}
