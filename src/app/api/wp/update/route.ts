import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { htmlToGutenbergBlocks } from "@/lib/gutenberg";

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";
const WP_USER = process.env.WP_APPLICATION_USER || "admin";
const WP_APP_PASSWORD = process.env.WP_APPLICATION_PASSWORD || "";

/**
 * Safely bust Next.js route cache without crashing under Turbopack / dev.
 */
async function safeRevalidate(paths: string[]) {
  try {
    const { revalidatePath } = await import("next/cache");
    for (const p of paths) {
      try {
        revalidatePath(p);
      } catch {
        /* non-fatal */
      }
    }
  } catch {
    /* next/cache unavailable in this runtime context */
  }
}

/**
 * Update a standard WordPress post (transcripts / manuals).
 * Uses the WP REST API: PUT /wp-json/wp/v2/posts/<id>
 */
async function updateWPPost(
  id: number,
  updateBody: Record<string, unknown>,
): Promise<{
  ok: boolean;
  status: number;
  data?: { id: number; link: string };
  error?: string;
}> {
  const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

  let res: Response;
  try {
    res = await fetch(`${WP_URL}/wp-json/wp/v2/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify(updateBody),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: "Network error reaching WordPress",
    };
  }

  if (!res.ok) {
    let errorDetail = `WordPress returned ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.message) errorDetail = errData.message;
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, error: errorDetail };
  }

  const data = (await res.json()) as { id: number; link: string };
  return { ok: true, status: 200, data };
}

/**
 * Update a Series Engine audio sermon.
 * Uses the custom NLWC REST API: PUT /wp-json/nlwc/v1/sermons/<id>
 * Requires the PUT route added to nlwc-sermons-api.php (v1.3.0+).
 */
async function updateSESermon(
  id: number,
  updateBody: Record<string, unknown>,
): Promise<{
  ok: boolean;
  status: number;
  data?: { id: number; link: string };
  error?: string;
}> {
  const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

  let res: Response;
  try {
    res = await fetch(`${WP_URL}/wp-json/nlwc/v1/sermons/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // WP Application Password auth — same credentials used for wp/v2 routes
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify(updateBody),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: "Network error reaching WordPress",
    };
  }

  if (res.status === 404) {
    return {
      ok: false,
      status: 501,
      error:
        "The Series Engine PUT endpoint is not registered. " +
        "Ensure nlwc-sermons-api.php v1.3.0+ is deployed to wp-content/mu-plugins/.",
    };
  }

  if (!res.ok) {
    let errorDetail = `NLWC API returned ${res.status}`;
    try {
      const errData = await res.json();
      if (errData?.message) errorDetail = errData.message;
      else if (errData?.error) errorDetail = errData.error;
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, error: errorDetail };
  }

  const data = (await res.json()) as { id: number; success?: boolean };
  return { ok: true, status: 200, data: { id: data.id, link: "" } };
}

// =============================================================================
// PUT /api/wp/update
// =============================================================================

export async function PUT(request: NextRequest) {
  // ── 1. Auth — MUST be awaited; requireAuth is async in auth.ts ──────────
  const authError = await requireAuth(request);
  if (authError) return authError;

  // ── 2. Rate limiting ──────────────────────────────────────────────────────
  const rateLimitError = rateLimitMiddleware(request, "authenticated");
  if (rateLimitError) return rateLimitError;

  if (!WP_APP_PASSWORD) {
    return NextResponse.json(
      { error: "WP_APPLICATION_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    id,
    type, // "sermon" | "transcript" | "manual" — sent by admin/page.tsx
    title,
    content,
    status,
    featuredMediaId,
    date,
    categories,
    speaker,
    seriesId,
    audioUrl,
    thumbnailUrl,
    manualTheme,
  } = body as {
    id?: number;
    type?: string;
    title?: string;
    content?: string;
    status?: string;
    featuredMediaId?: number;
    date?: string;
    categories?: (number | string)[];
    speaker?: string;
    seriesId?: number;
    audioUrl?: string;
    thumbnailUrl?: string;
    manualTheme?: string;
    [key: string]: unknown;
  };

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  // ── Route to correct backend by content type ──────────────────────────────
  if (type === "sermon") {
    // Sermons live in Series Engine DB tables — use /nlwc/v1/sermons/<id>
    const seBody: Record<string, unknown> = {};
    if (title) seBody.title = title;
    if (speaker) seBody.speaker = speaker;
    if (date) seBody.date = date;
    if (seriesId) seBody.series_id = seriesId;
    if (content) seBody.description = content;
    // Audio & thumbnail are URLs in Series Engine, not WP media attachments.
    if (audioUrl) seBody.audio_url = audioUrl;
    if (thumbnailUrl) seBody.message_thumbnail = thumbnailUrl;

    const result = await updateSESermon(id, seBody);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    await safeRevalidate(["/sermons", "/admin/content"]);
    return NextResponse.json({ success: true, postId: result.data!.id });
  }

  // Transcripts and manuals — standard WP posts via /wp/v2/posts/<id>
  const wpBody: Record<string, unknown> = {};
  if (title) wpBody.title = title;
  // Serialize to Gutenberg blocks (see gutenberg.ts) so edited posts are stored
  // as native blocks, not a Classic block that wpautop would mangle on render.
  if (content) wpBody.content = htmlToGutenbergBlocks(content);
  if (status !== undefined) wpBody.status = status;
  if (featuredMediaId !== undefined)
    wpBody.featured_media = Number(featuredMediaId);
  if (date !== undefined) wpBody.date = date;
  if (Array.isArray(categories) && categories.length > 0) {
    wpBody.categories = categories.map((c) =>
      typeof c === "string" ? parseInt(c, 10) : c,
    );
  }
  // Manual theme override — stored as post meta (nlwc-manual-theme mu-plugin),
  // set by the admin drag-and-drop grouping. Empty string clears the override.
  if (manualTheme !== undefined) {
    wpBody.meta = { nlwc_manual_theme: manualTheme };
  }

  if (Object.keys(wpBody).length === 0) {
    return NextResponse.json(
      { error: "At least one field to update is required" },
      { status: 400 },
    );
  }

  const result = await updateWPPost(id, wpBody);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  await safeRevalidate(["/transcripts", "/manuals", "/sermons", "/admin/content"]);
  return NextResponse.json({
    success: true,
    postId: result.data!.id,
    postUrl: result.data!.link,
  });
}
