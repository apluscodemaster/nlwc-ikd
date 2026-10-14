import { ImageResponse } from "next/og";
import { getManualBySlug } from "@/lib/wordpress";
import { manualBackgroundFor } from "@/utils/manualThumbnail";

/**
 * GET /api/manuals/<slug>/og
 *
 * 1200×630 link-preview image for a manual WITHOUT a featured image: a
 * recreation of its placeholder card on the manuals page (ManualThumbnail) —
 * same background photo, dark overlay, label and title — so a shared link
 * previews the way the card looks. Manuals that do have a featured image use
 * that image directly instead (see generateMetadata in manuals/[slug]).
 *
 * Keyed by slug rather than taking the title as a parameter, so it can only
 * ever render real manual titles.
 */

const SIZE = { width: 1200, height: 630 };

// One cached render per manual; titles rarely change once published.
const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/**
 * Cloudinary rendition of the background at exactly the preview size. The
 * source photos are only 640×640, so filling 1200×630 is a ~1.9× enlargement
 * that comes out soft; `e_upscale` (Cloudinary's AI super-resolution) runs
 * first so the crop is taken from a genuinely sharper image. Cloudinary
 * caches the derived image, so the upscale only runs once per photo.
 */
function previewBackground(url: string): string {
  return url.replace(
    "/upload/",
    `/upload/e_upscale/c_fill,g_auto,w_${SIZE.width},h_${SIZE.height},f_jpg,q_auto:best/`,
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const manual = await getManualBySlug(slug).catch(() => null);
  if (!manual) {
    return new Response("Manual not found", { status: 404 });
  }

  const background = previewBackground(manualBackgroundFor(manual.title));

  const image = new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          color: "#ffffff",
        }}
      >
        {/* Background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain <img> */}
        <img
          src={background}
          alt=""
          width={SIZE.width}
          height={SIZE.height}
          style={{ position: "absolute", inset: 0, objectFit: "cover" }}
        />

        {/* Dark overlay for text readability (matches the card) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)",
          }}
        />

        {/* Icon */}
        <div
          style={{
            position: "absolute",
            top: 48,
            left: 56,
            width: 88,
            height: 88,
            borderRadius: 22,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 7v14" />
            <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
          </svg>
        </div>

        {/* "Sunday School" label */}
        <div
          style={{
            position: "absolute",
            top: 64,
            right: 56,
            display: "flex",
            padding: "12px 22px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Sunday School Manuals
        </div>

        {/* Full title text */}
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            bottom: 56,
            display: "flex",
            fontSize: manual.title.length > 70 ? 52 : 64,
            fontWeight: 700,
            lineHeight: 1.2,
            textShadow: "0 4px 16px rgba(0,0,0,0.6)",
          }}
        >
          {manual.title}
        </div>
      </div>
    ),
    { ...SIZE },
  );

  image.headers.set("Cache-Control", CACHE_CONTROL);
  return image;
}
