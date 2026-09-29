import { NextRequest, NextResponse } from "next/server";
import { requireAuthActor } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { fixThumbnailUrl } from "@/lib/audioSermons";

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";
const WP_USER = process.env.WP_APPLICATION_USER || "admin";
const WP_APP_PASSWORD = process.env.WP_APPLICATION_PASSWORD || "";

export const dynamic = "force-dynamic";

const MAX_PER_PAGE = 48;

interface WPMediaItem {
  id: number;
  date: string;
  source_url: string;
  mime_type: string;
  alt_text?: string;
  title?: { rendered?: string };
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, { source_url?: string }>;
  };
}

/**
 * GET /api/wp/media?page=1&per_page=24&search=
 *
 * Lists images already in the WordPress Media Library so the admin can pick an
 * existing one as a sermon thumbnail instead of re-uploading it. Newest first.
 *
 * Requires: Authorization: Bearer <Firebase ID token>. Uploading lives at
 * /api/wp/upload-media; this is the read side of the same library.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuthActor(request);
  if (auth.response) return auth.response;

  const rateLimitError = rateLimitMiddleware(request, "authenticated");
  if (rateLimitError) return rateLimitError;

  if (!WP_APP_PASSWORD) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number(searchParams.get("per_page")) || 24),
  );
  const search = (searchParams.get("search") || "").trim();
  // Paging back and forth through the picker would otherwise re-hit WordPress
  // for every click. A short Data Cache window absorbs that; the picker's
  // Refresh button sets refresh=1 to bypass it after a new upload.
  const refresh = searchParams.get("refresh") === "1";

  const params = new URLSearchParams({
    media_type: "image",
    page: String(page),
    per_page: String(perPage),
    orderby: "date",
    order: "desc",
    // Only the fields the picker renders — the full payload per attachment is
    // large and most of it is unused here.
    _fields: "id,date,source_url,mime_type,alt_text,title,media_details",
  });
  if (search) params.set("search", search);

  const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

  try {
    const response = await fetch(
      `${WP_URL}/wp-json/wp/v2/media?${params.toString()}`,
      {
        headers: { Authorization: `Basic ${token}` },
        ...(refresh ? { cache: "no-store" as const } : { next: { revalidate: 30 } }),
      },
    );

    if (!response.ok) {
      // A page past the end returns 400 (rest_post_invalid_page_number) —
      // that's an empty result for the picker, not an error.
      if (response.status === 400 && page > 1) {
        return NextResponse.json({ items: [], page, totalPages: page - 1 });
      }
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

    const data = (await response.json()) as WPMediaItem[];
    const totalPages = Number(response.headers.get("X-WP-TotalPages")) || 1;

    const items = (data || []).map((item) => {
      const sizes = item.media_details?.sizes || {};
      const preview =
        sizes.medium?.source_url ||
        sizes.thumbnail?.source_url ||
        item.source_url;
      return {
        id: item.id,
        // Full-size URL — what gets stored on the sermon.
        url: fixThumbnailUrl(item.source_url) || item.source_url,
        // Smaller rendition for the picker grid.
        thumbnailUrl: fixThumbnailUrl(preview) || preview,
        title: item.title?.rendered || item.alt_text || `Image #${item.id}`,
        alt: item.alt_text || "",
        date: item.date,
        mimeType: item.mime_type,
        width: item.media_details?.width ?? null,
        height: item.media_details?.height ?? null,
      };
    });

    return NextResponse.json({ items, page, totalPages });
  } catch (error) {
    console.error("Media library fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to load the media library" },
      { status: 500 },
    );
  }
}
