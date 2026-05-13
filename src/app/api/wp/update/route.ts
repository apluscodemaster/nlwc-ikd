import { NextRequest, NextResponse } from "next/server";

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";
const WP_USER = process.env.WP_APPLICATION_USER || "admin";
const WP_APP_PASSWORD = process.env.WP_APPLICATION_PASSWORD || "";

/**
 * PUT /api/wp/update
 *
 * Updates an existing WordPress post by ID.
 * Accepts: { id, title, content, status, featuredMediaId?, date?, categories?, speaker? }
 * Note: speaker is optional and can be included in the payload for reference (it's embedded in content)
 */
export async function PUT(request: NextRequest) {
  if (!WP_APP_PASSWORD) {
    return NextResponse.json(
      { error: "WP_APPLICATION_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { id, title, content, status, featuredMediaId, date, categories } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    if (
      !title &&
      !content &&
      !status &&
      !featuredMediaId &&
      !date &&
      !categories
    ) {
      return NextResponse.json(
        { error: "At least one field to update is required" },
        { status: 400 },
      );
    }

    const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString(
      "base64",
    );

    // Build the update payload — only include fields that were provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateBody: Record<string, any> = {};
    if (title !== undefined && title) updateBody.title = title;
    if (content !== undefined && content) updateBody.content = content;
    if (status !== undefined) updateBody.status = status;
    if (featuredMediaId !== undefined)
      updateBody.featured_media = Number(featuredMediaId);
    if (date !== undefined) updateBody.date = date;
    // Only include categories if they're a valid array
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
        // If response is not JSON, use the statusText
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
    return NextResponse.json({
      success: true,
      postId: data.id,
      postUrl: data.link,
    });
  } catch (error) {
    console.error("Update post failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to update post: ${errorMessage}` },
      { status: 500 },
    );
  }
}
