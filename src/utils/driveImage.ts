// utils/driveImage.ts
import type { NormalizedColumn } from "@/app/api/sheet/route";

/**
 * Detect the source type of a Google image URL.
 *
 * Possible return values:
 *  - "googleusercontent" – already a direct lh3.googleusercontent.com link (Drive or Photos)
 *  - "drive"             – a Google Drive share/view URL containing a file ID
 *  - "googlephotos"      – a Google Photos share URL (photos.google.com or photos.app.goo.gl)
 *  - "unknown"           – not a recognised Google image URL
 */
export type GoogleImageSource =
  | "googleusercontent"
  | "drive"
  | "googlephotos"
  | "unknown";

export function detectGoogleImageSource(url: string): GoogleImageSource {
  if (!url) return "unknown";
  const u = url.trim();

  // Already a direct googleusercontent link (works for both Drive and Photos)
  if (u.includes("lh3.googleusercontent.com")) return "googleusercontent";

  // Google Drive patterns
  if (
    u.includes("drive.google.com") ||
    u.includes("docs.google.com") ||
    /[?&]id=[a-zA-Z0-9_-]{10,}/.test(u)
  ) {
    return "drive";
  }

  // Google Photos patterns
  if (u.includes("photos.google.com") || u.includes("photos.app.goo.gl")) {
    return "googlephotos";
  }

  return "unknown";
}

/**
 * In-memory cache for resolved Google Photos share links.
 * Avoids re-resolving the same link on every request.
 */
const resolvedCache = new Map<string, string>();

/**
 * Resolve a Google Photos share link to its direct image URL.
 *
 * Google Photos share links (photos.app.goo.gl/...) are NOT direct image URLs.
 * They redirect to an HTML page on photos.google.com. To display the image, we
 * need to extract the actual lh3.googleusercontent.com URL from that page's
 * Open Graph / Twitter Card meta tags, or from embedded data attributes.
 *
 * Strategy order:
 *  1. Check in-memory cache
 *  2. Follow redirects to photos.google.com and scrape og:image / meta tags
 *  3. Scan the full HTML body for any lh3.googleusercontent.com URL
 *  4. Return empty string on failure (caller should filter these out)
 */
export async function resolveGooglePhotosShareLink(
  shareUrl: string,
): Promise<string> {
  if (!shareUrl.includes("photos")) {
    return shareUrl;
  }

  // Check cache first
  const cached = resolvedCache.get(shareUrl);
  if (cached !== undefined) {
    return cached;
  }

  try {
    console.log("🔍 Resolving Google Photos share link:", shareUrl);

    // ── Strategy: GET with a browser-like User-Agent ──
    // Google serves different content based on User-Agent.
    // A full browser UA gets the richest HTML with og:image meta tags.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(shareUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timeoutId);

    // If the final URL itself is already an lh3 link, use it directly
    if (response.url.includes("lh3.googleusercontent.com")) {
      const cleanUrl = response.url.split("?")[0];
      resolvedCache.set(shareUrl, cleanUrl);
      console.log("✅ Resolved (redirect URL):", cleanUrl);
      return cleanUrl;
    }

    if (!response.ok) {
      console.warn(
        `⚠️ Google Photos returned HTTP ${response.status} for:`,
        shareUrl,
      );
      resolvedCache.set(shareUrl, "");
      return "";
    }

    const html = await response.text();

    // ── Extract from meta tags (most reliable) ──
    // Google populates og:image and twitter:image for SEO on public share pages.
    const metaPatterns = [
      // og:image meta tag (most common)
      /<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+(?:property|name)="og:image"/i,
      // twitter:image meta tag
      /<meta\s+(?:property|name)="twitter:image"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+(?:property|name)="twitter:image"/i,
    ];

    for (const pattern of metaPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // Decode HTML entities that Google may use in meta content
        let url = match[1]
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');

        // Strip size parameters to get the base URL
        // e.g. ...=w1200-h630-no → base URL
        url = url.replace(/=w\d+-h\d+(-[a-z]+)*$/, "");

        if (url.includes("lh3.googleusercontent.com")) {
          resolvedCache.set(shareUrl, url);
          console.log("✅ Resolved (og:image):", url);
          return url;
        }
      }
    }

    // ── Fallback: scan full HTML for any lh3 URL ──
    const lh3Patterns = [
      /https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_\-\/]+/g,
      /https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9_\-\/]+/g,
    ];

    for (const pattern of lh3Patterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // Pick the longest match (most complete URL)
        const best = matches.sort((a, b) => b.length - a.length)[0];
        resolvedCache.set(shareUrl, best);
        console.log("✅ Resolved (HTML scan):", best);
        return best;
      }
    }

    // Could not resolve
    console.error(
      "❌ Failed to resolve Google Photos share link:",
      shareUrl,
      "\n📝 Hint: Use the direct image URL from Google Photos instead:\n" +
        "   1. Open the photo in Google Photos\n" +
        "   2. Right-click the image → 'Copy image address'\n" +
        "   3. Paste the lh3.googleusercontent.com URL into the spreadsheet",
    );

    resolvedCache.set(shareUrl, "");
    return "";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("⚠️ Resolution timed out:", shareUrl);
    } else {
      console.error("❌ Unexpected error resolving:", shareUrl, error);
    }
    resolvedCache.set(shareUrl, "");
    return "";
  }
}

/**
 * Convert a Google image URL (Drive or Photos) into a direct displayable link.
 *
 * ── Google Drive ──
 *   https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 *   → https://lh3.googleusercontent.com/d/FILE_ID
 *
 * ── Google Photos (direct lh3 link) ──
 *   https://lh3.googleusercontent.com/pw/HASH...
 *   → returned as-is (already direct)
 *
 * ── Google Photos (share link) ──
 *   https://photos.app.goo.gl/yGxvsFWM1HBWhtf66
 *   → requires async resolution via resolveGooglePhotosShareLink()
 */
export function toGoogleImageURL(url: string): string {
  if (!url) return "";

  const cleanedUrl = url.trim();
  const source = detectGoogleImageSource(cleanedUrl);

  switch (source) {
    // ── Already a direct googleusercontent link ──
    // Works for BOTH Google Drive (`/d/ID`) and Google Photos (`/pw/HASH`)
    case "googleusercontent":
      return cleanedUrl;

    // ── Google Drive share URLs ──
    case "drive": {
      const match =
        cleanedUrl.match(/\/d\/([a-zA-Z0-9_-]{10,})/) ||
        cleanedUrl.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);

      const id = match ? match[1] : null;
      if (!id) {
        console.warn(
          "⚠️ Could not extract Google Drive file ID from:",
          cleanedUrl,
        );
        return cleanedUrl;
      }
      return `https://lh3.googleusercontent.com/d/${id}`;
    }

    // ── Google Photos share URLs ──
    // Note: These require async resolution. Use resolveGooglePhotosShareLink() in async contexts.
    case "googlephotos":
      console.warn(
        "⚠️ Google Photos share link detected. Use resolveGooglePhotosShareLink() for proper conversion:",
        cleanedUrl,
      );
      return cleanedUrl;

    // ── Unknown / external URLs ──
    default:
      return cleanedUrl;
  }
}

/**
 * Convert an array of Google image URLs (Drive or Photos) into displayable format.
 * For Google Photos share links, performs async resolution.
 */
export async function convertGoogleImageArray(
  urls: string[] = [],
): Promise<string[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const source = detectGoogleImageSource(url);
      if (source === "googlephotos") {
        return resolveGooglePhotosShareLink(url);
      }
      return toGoogleImageURL(url);
    }),
  );
  return results;
}

/**
 * Clean any column with a `values` and/or `images` array —
 * converts all image URLs (Drive & Photos share links) to direct lh3 URLs.
 * Handles async resolution of Google Photos share links.
 *
 * IMPORTANT: The raw Google Sheets data stores URLs in `values`.
 * The `images` array only exists after groupColumnsToDates() merges them.
 * We must process `values` here so the URLs are resolved BEFORE grouping.
 */
export async function cleanImageColumns(
  columns: NormalizedColumn[],
): Promise<NormalizedColumn[]> {
  const results = await Promise.all(
    columns.map(async (col) => ({
      ...col,
      // Process the `values` array (raw URLs from Google Sheets)
      values: Array.isArray(col.values)
        ? await convertGoogleImageArray(col.values)
        : col.values,
      // Also process `images` if it exists (for post-grouped data)
      images: Array.isArray(col.images)
        ? await convertGoogleImageArray(col.images)
        : col.images,
    })),
  );
  return results;
}

/**
 * Check whether a URL is a Google Photos direct link (lh3 /pw/ path).
 */
export function isGooglePhotosDirectLink(url: string): boolean {
  return /lh3\.googleusercontent\.com\/pw\//.test(url);
}

/**
 * Check whether a URL is a Google Drive direct link (lh3 /d/ path).
 */
export function isGoogleDriveDirectLink(url: string): boolean {
  return /lh3\.googleusercontent\.com\/d\//.test(url);
}
