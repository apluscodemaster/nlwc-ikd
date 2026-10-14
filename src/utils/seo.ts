// Shared SEO helpers for metadata and JSON-LD structured data.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ikorodu.nlwc.church";
// 1200×630 social-share card derived from the hero photo via Cloudinary (JPG
// for broad scraper support). Keep in sync with OG_IMAGE in src/app/layout.tsx.
export const OG_IMAGE =
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1774247833/nlwc-ikd-assets/ygkueoffnv3wvqy4d7ir.jpg";
/** A link-preview image with its real pixel size (0 = unknown). */
export interface OgImage {
  url: string;
  width: number;
  height: number;
}

/**
 * Open Graph image entry. Declaring the real size lets Facebook/LinkedIn/X
 * render the large preview straight away instead of guessing (or shrinking
 * it to a small thumbnail); an unknown size is simply left out.
 */
export function ogImageEntry(image: OgImage, alt: string) {
  return image.width && image.height
    ? { url: image.url, width: image.width, height: image.height, alt }
    : { url: image.url, alt };
}

// 1200×630 labelled card used as the link preview for every transcript
// (public/nlwc-transcript-meta-labeled.jpg). Transcripts have no per-post image.
// Served as-is — exactly the preview size, so nothing is scaled.
export const TRANSCRIPT_OG_IMAGE: OgImage = {
  url: `${SITE_URL}/nlwc-transcript-meta-labeled.jpg`,
  width: 1200,
  height: 630,
};

/**
 * Link-preview image for a manual: its own featured image when it has one,
 * otherwise a generated 1200×630 recreation of its placeholder card (see
 * /api/manuals/[slug]/og) — either way, what its card on /manuals shows.
 */
export function manualShareImage(slug: string, featured?: OgImage): OgImage {
  return (
    featured ?? {
      url: `${SITE_URL}/api/manuals/${encodeURIComponent(slug)}/og`,
      width: 1200,
      height: 630,
    }
  );
}

export const SITE_NAME ="The New & Living Way Church, Ikorodu";

/** Organization/publisher node reused across structured data. */
export const PUBLISHER = {
  "@type": "Organization",
  name: "The New & Living Way Church",
  alternateName: "NLWC Ikorodu",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/nlwcikd-logo-512x512.png`,
    width: 512,
    height: 512,
  },
} as const;

/** Strip HTML tags and decode the common entities for meta / JSON-LD text. */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&hellip;/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build an absolute URL from a path, or pass an absolute one through. */
export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Convert a date-ish string to ISO 8601, or undefined if unparseable. */
export function toIsoDate(
  value: string | undefined | null,
): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Convert "mm:ss" / "hh:mm:ss" to an ISO-8601 duration (PT#H#M#S). */
export function parseDurationToISO(
  value: string | undefined | null,
): string | undefined {
  if (!value) return undefined;
  const parts = value.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) return undefined;
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else return undefined;
  const out = `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}`;
  return out === "PT" ? undefined : out;
}

/** Clean and truncate text to a sensible meta-description length. */
export function metaDescription(
  text: string | undefined | null,
  max = 160,
): string {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}
