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
  if (
    u.includes("photos.google.com") ||
    u.includes("photos.app.goo.gl")
  ) {
    return "googlephotos";
  }

  return "unknown";
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
 *   https://photos.google.com/share/AF1Qip.../photo/AF1Qip...
 *   → passed through as-is; these need server-side resolution or the user
 *     should paste the direct lh3 link from the photo's "Share" → "Copy link"
 *     option in Google Photos.
 *
 * In practice users should paste the **direct image link** from Google Photos,
 * which is already an lh3.googleusercontent.com URL and works out of the box
 * with the existing size-parameter system (=w800, =s0, etc.).
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
    // These short/share links cannot be converted client-side to a direct image.
    // Return as-is so the image still attempts to load (browser may follow redirect).
    // Ideally the spreadsheet should contain the direct lh3 link.
    case "googlephotos":
      console.warn(
        "⚠️ Google Photos share link detected. For best results, use the direct lh3.googleusercontent.com link:",
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
 */
export function convertGoogleImageArray(urls: string[] = []): string[] {
  return urls.map((url) => toGoogleImageURL(url));
}

/**
 * Clean any object with an `images` array — converts all image URLs safely.
 */
export function cleanImageColumns(
  columns: NormalizedColumn[],
): NormalizedColumn[] {
  return columns.map((col) => ({
    ...col,
    images: Array.isArray(col.images)
      ? convertGoogleImageArray(col.images)
      : [],
  }));
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
