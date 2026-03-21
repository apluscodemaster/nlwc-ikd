/**
 * Calculates the estimated reading time for a given text.
 * Based on an average reading speed of 200 words per minute.
 *
 * @param content The text or HTML content to calculate reading time for.
 * @returns The estimated reading time in minutes (minimum 1).
 */
export function calculateReadingTime(content: string): number {
  if (!content) return 0;

  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, "");

  // Count words (splitting by whitespace)
  const words = text.trim().split(/\s+/).length;

  // Calculate minutes (avg 200 words per minute)
  const readingTime = Math.ceil(words / 200);

  return readingTime || 1;
}
