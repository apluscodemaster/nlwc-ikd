import { NextRequest, NextResponse } from "next/server";

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikorodu.nlwc.church";
const WP_USER = process.env.WP_APPLICATION_USER || "admin";
const WP_APP_PASSWORD = process.env.WP_APPLICATION_PASSWORD || "";

/**
 * POST /api/wp/upload-media
 *
 * Accepts a multipart form with a single file field ("file")
 * and uploads it to the WordPress Media Library.
 *
 * Returns { id, url } of the created media attachment.
 */
export async function POST(request: NextRequest) {
  if (!WP_APP_PASSWORD) {
    return NextResponse.json(
      { error: "WP_APPLICATION_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file into a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Build Basic Auth header
    const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString(
      "base64",
    );

    // Upload to WordPress Media Library
    const response = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      },
      body: buffer,
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

    const data = (await response.json()) as {
      id: number;
      source_url: string;
      media_details?: {
        sizes?: {
          medium?: { source_url: string };
          thumbnail?: { source_url: string };
        };
      };
    };

    return NextResponse.json({
      id: data.id,
      url: data.source_url,
      thumbnailUrl:
        data.media_details?.sizes?.medium?.source_url ||
        data.media_details?.sizes?.thumbnail?.source_url ||
        data.source_url,
    });
  } catch (error) {
    console.error("Media upload failed:", error);
    return NextResponse.json(
      { error: "Failed to upload media" },
      { status: 500 },
    );
  }
}
