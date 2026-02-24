/**
 * Utility to highlight search keywords in HTML content.
 * Safely injects <mark> tags around matched text while preserving
 * existing HTML structure (won't break tags or attributes).
 */

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights search keywords within HTML content by wrapping matches
 * in <mark> tags. Only highlights text nodes — never modifies
 * HTML tags or attributes.
 *
 * @param html - The HTML content string
 * @param query - The search query to highlight
 * @returns HTML string with <mark> highlights applied
 */
export function highlightSearchInHtml(html: string, query: string): string {
  if (!query || !query.trim() || !html) return html;

  const trimmedQuery = query.trim();
  // Split query into individual words for multi-word highlighting
  const words = trimmedQuery
    .split(/\s+/)
    .filter((w) => w.length >= 2) // Only highlight words with 2+ chars
    .map(escapeRegExp);

  if (words.length === 0) return html;

  // Build regex that matches any of the search words
  const pattern = new RegExp(`(${words.join("|")})`, "gi");

  // Split HTML into text segments and tag segments
  // This ensures we never modify text inside HTML tags
  const parts = html.split(/(<[^>]*>)/g);

  const highlighted = parts.map((part) => {
    // If this part is an HTML tag, leave it alone
    if (part.startsWith("<")) return part;
    // Otherwise, it's text content — apply highlighting
    return part.replace(pattern, '<mark class="search-highlight">$1</mark>');
  });

  return highlighted.join("");
}

/**
 * Highlights search keywords in plain text (non-HTML) by wrapping
 * matches in <mark> tags.
 *
 * @param text - The plain text string
 * @param query - The search query to highlight
 * @returns HTML string (safe — the input text is escaped first)
 */
export function highlightSearchInText(text: string, query: string): string {
  if (!query || !query.trim() || !text) return text;

  const trimmedQuery = query.trim();
  const words = trimmedQuery
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map(escapeRegExp);

  if (words.length === 0) return text;

  const pattern = new RegExp(`(${words.join("|")})`, "gi");

  // Escape HTML entities in the text first
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(pattern, '<mark class="search-highlight">$1</mark>');
}
