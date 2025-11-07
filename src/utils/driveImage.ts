// utils/driveImage.ts
import type { NormalizedColumn } from "@/app/api/sheet/route";

/**
 * Convert a Google Drive file URL into a direct high-quality Googleusercontent image link.
 * Example:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 * → https://lh3.googleusercontent.com/d/FILE_ID
 */
export function toGoogleImageURL(url: string): string {
  if (!url) return "";

  const cleanedUrl = url.trim();

  // Match patterns like:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  const match =
    cleanedUrl.match(/\/d\/([a-zA-Z0-9_-]{10,})/) ||
    cleanedUrl.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);

  const id = match ? match[1] : null;

  if (!id) {
    console.warn("⚠️ Could not extract Google Drive file ID from:", cleanedUrl);
    return cleanedUrl;
  }

  // ✅ Return the high-quality direct image link
  return `https://lh3.googleusercontent.com/d/${id}`;
}

/**
 * Convert an array of Google Drive URLs into Googleusercontent format.
 */
export function convertGoogleImageArray(urls: string[] = []): string[] {
  return urls.map((url) => toGoogleImageURL(url));
}

/**
 * Clean any object with an `images` array — converts all image URLs safely.
 */
export function cleanImageColumns(
  columns: NormalizedColumn[]
): NormalizedColumn[] {
  return columns.map((col) => ({
    ...col,
    images: Array.isArray(col.images)
      ? convertGoogleImageArray(col.images)
      : [],
  }));
}
