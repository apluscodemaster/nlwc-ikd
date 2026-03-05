import { NextRequest, NextResponse } from "next/server";

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikorodu.nlwc.church";
const WP_USER = process.env.WP_APPLICATION_USER || "admin";
const WP_APP_PASSWORD = process.env.WP_APPLICATION_PASSWORD || "";

/**
 * PUT /api/wp/update
 *
 * Updates an existing WordPress post by ID.
 * Accepts: { id, title, content, status, featuredMediaId? }
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
    const { id, title, content, status, featuredMediaId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 },
      );
    }

    const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString(
      "base64",
    );

    // Build the update payload — only include fields that were provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateBody: Record<string, any> = {};
    if (title !== undefined) updateBody.title = title;
    if (content !== undefined) updateBody.content = content;
    if (status !== undefined) updateBody.status = status;
    if (featuredMediaId !== undefined)
      updateBody.featured_media = Number(featuredMediaId);

    const response = await fetch(`${WP_URL}/wp-json/wp/v2/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify(updateBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            `WordPress returned ${response.status}`,
        },
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
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}
