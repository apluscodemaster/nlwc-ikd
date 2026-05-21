import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";
const WP_USER = process.env.WP_APPLICATION_USER || "admin";
const WP_APP_PASSWORD = process.env.WP_APPLICATION_PASSWORD || "";

/**
 * PUT /api/wp/update
 *
 * Updates existing content by ID. Routes to the correct backend:
 * - type="sermon" → Series Engine via nlwc/v1/sermons/{id} (SE message IDs)
 * - type="transcript"|"manual" (default) → WordPress via wp/v2/posts/{id}
 *
 * Accepts: { id, type?, title, content, status, featuredMediaId?, date?,
 *            categories?, speaker?, audioUrl? }
 */
export async function PUT(request: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const authError = await requireAuth(request);
  if (authError) {
    return authError;
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rateLimitError = rateLimitMiddleware(request, "authenticated");
  if (rateLimitError) {
    return rateLimitError;
  }

  if (!WP_APP_PASSWORD) {
    return NextResponse.json(
      { error: "WP_APPLICATION_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { id, type } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString(
      "base64",
    );

    // ── Sermon updates → Series Engine custom endpoint ──────────────────────
    if (type === "sermon") {
      return handleSermonUpdate(id, body, token);
    }

    // ── Transcript / Manual updates → wp/v2/posts ───────────────────────────
    return handleWPPostUpdate(id, body, token);
  } catch (error) {
    console.error("Update post failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to update post: ${errorMessage}` },
      { status: 500 },
    );
  }
}

// ── Sermon update via Series Engine nlwc/v1/sermons/{id} ──────────────────────
async function handleSermonUpdate(
  id: number | string,
  body: Record<string, unknown>,
  token: string,
) {
  const { title, content, date, speaker, audioUrl, categories } = body as {
    title?: string;
    content?: string;
    date?: string;
    speaker?: string;
    audioUrl?: string;
    categories?: (string | number)[];
  };

  // Map admin form fields → SE message columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seBody: Record<string, any> = {};
  if (title) seBody.title = title;
  if (content) seBody.description = content;
  if (date) seBody.date = date;
  if (speaker) seBody.speaker = speaker;
  if (audioUrl) seBody.audio_url = audioUrl;
  if (Array.isArray(categories) && categories.length > 0) {
    seBody.series_id =
      typeof categories[0] === "string"
        ? parseInt(categories[0], 10)
        : categories[0];
  }

  if (Object.keys(seBody).length === 0) {
    return NextResponse.json(
      { error: "At least one field to update is required" },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${WP_URL}/wp-json/nlwc/v1/sermons/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify(seBody),
    },
  );

  if (!response.ok) {
    let errorDetail = `Series Engine returned ${response.status}`;
    try {
      const errorData = await response.json();
      errorDetail = errorData.error || errorData.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    console.error(`Series Engine API error: ${errorDetail}`, {
      status: response.status,
      id,
    });
    return NextResponse.json(
      { error: errorDetail },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { success: boolean; id: number };

  try {
    revalidatePath("/sermons");
    revalidatePath("/admin");
  } catch {
    // safe to ignore
  }

  return NextResponse.json({
    success: true,
    postId: data.id,
  });
}

// ── WP post update via wp/v2/posts/{id} ───────────────────────────────────────
async function handleWPPostUpdate(
  id: number | string,
  body: Record<string, unknown>,
  token: string,
) {
  const { title, content, status, featuredMediaId, date, categories } =
    body as {
      title?: string;
      content?: string;
      status?: string;
      featuredMediaId?: number | string;
      date?: string;
      categories?: (string | number)[];
    };

  if (!title && !content && !status && !featuredMediaId && !date && !categories) {
    return NextResponse.json(
      { error: "At least one field to update is required" },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateBody: Record<string, any> = {};
  if (title !== undefined && title) updateBody.title = title;
  if (content !== undefined && content) updateBody.content = content;
  if (status !== undefined) updateBody.status = status;
  if (featuredMediaId !== undefined)
    updateBody.featured_media = Number(featuredMediaId);
  if (date !== undefined) updateBody.date = date;
  if (Array.isArray(categories) && categories.length > 0) {
    updateBody.categories = categories.map((c) =>
      typeof c === "string" ? parseInt(c, 10) : c,
    );
  }

  const response = await fetch(`${WP_URL}/wp-json/wp/v2/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify(updateBody),
  });

  if (!response.ok) {
    let errorDetail = `WordPress returned ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorDetail = errorData.message;
      } else if (errorData.code) {
        errorDetail = `${errorData.code}: ${errorData.message || "Unknown error"}`;
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    console.error(`WordPress API error: ${errorDetail}`, {
      status: response.status,
      id,
    });
    return NextResponse.json(
      { error: errorDetail },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { id: number; link: string };

  try {
    revalidatePath("/sermons");
    revalidatePath("/transcripts");
    revalidatePath("/manuals");
    revalidatePath("/admin");
    revalidatePath(`/sermons/${(body as { slug?: string }).slug ?? ""}`);
    revalidatePath(`/transcripts/${(body as { slug?: string }).slug ?? ""}`);
    revalidatePath(`/manuals/${(body as { slug?: string }).slug ?? ""}`);
  } catch {
    // safe to ignore
  }

  return NextResponse.json({
    success: true,
    postId: data.id,
    postUrl: data.link,
  });
}
