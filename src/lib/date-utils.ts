/**
 * Formats a date string into a more readable format.
 * Example: "2026-01-26" -> "Jan 26, 2026"
 */
export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

/**
 * Normalizes a Google Drive image ID to a direct link.
 * (Reused from driveImage.ts)
 */
export function toGoogleImageURL(src: string): string {
  if (src.includes("http")) return src;
  return `https://lh3.googleusercontent.com/d/${src}`;
}
