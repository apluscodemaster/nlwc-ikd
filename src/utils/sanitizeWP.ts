/**
 * WordPress Content Sanitizer
 *
 * Cleans up HTML entities, special characters, and formatting artifacts
 * that come from the WordPress database/API.
 *
 * Use `sanitizeWPText()` for plain text (titles, excerpts) and
 * `sanitizeWPHtml()` for rich HTML content (post body).
 */

// ─── HTML Entity Map ──────────────────────────────────────────────────────────
const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#8211;": "–", // en-dash
  "&#8212;": "—", // em-dash
  "&#8216;": "\u2018", // left single quote
  "&#8217;": "\u2019", // right single quote (apostrophe)
  "&#8218;": "\u201A", // single low-9 quote
  "&#8220;": "\u201C", // left double quote
  "&#8221;": "\u201D", // right double quote
  "&#8222;": "\u201E", // double low-9 quote
  "&#8230;": "…", // ellipsis
  "&#8242;": "′", // prime
  "&#8243;": "″", // double prime
  "&#038;": "&",
  "&#38;": "&",
  "&#39;": "'",
  "&#34;": '"',
  "&#8226;": "•", // bullet
  "&#8364;": "€", // euro
  "&#8482;": "™", // trademark
  "&#169;": "©", // copyright
  "&#174;": "®", // registered
};

/**
 * Decode known HTML entities to their real characters.
 */
function decodeHTMLEntities(text: string): string {
  let result = text;

  // Replace named/numeric entities from our map
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    // Use case-insensitive regex for each entity
    result = result.replace(
      new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      char,
    );
  }

  // Catch any remaining numeric HTML entities (decimal)  &#123;
  result = result.replace(/&#(\d+);/g, (_, code) => {
    const num = parseInt(code, 10);
    return num > 0 ? String.fromCharCode(num) : "";
  });

  // Catch any remaining hex HTML entities  &#x1F4A9;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const num = parseInt(hex, 16);
    return num > 0 ? String.fromCharCode(num) : "";
  });

  return result;
}

/**
 * Sanitize plain text content from WordPress (titles, excerpts, speaker names).
 *
 * - Decodes HTML entities to real characters
 * - Strips leftover HTML tags
 * - Collapses excessive whitespace
 * - Trims leading/trailing whitespace
 */
export function sanitizeWPText(text: string): string {
  if (!text) return "";

  let clean = text;

  // Decode HTML entities
  clean = decodeHTMLEntities(clean);

  // Replace non-breaking spaces (unicode \u00A0) with regular spaces
  clean = clean.replace(/\u00A0/g, " ");

  // Strip any remaining HTML tags
  clean = clean.replace(/<[^>]*>/g, "");

  // Collapse multiple spaces into one
  clean = clean.replace(/\s{2,}/g, " ");

  // Trim
  clean = clean.trim();

  return clean;
}

/**
 * Sanitize rich HTML content from WordPress (post body).
 *
 * - Decodes HTML entities in text nodes (preserves HTML structure)
 * - Removes excessive &nbsp; sequences
 * - Cleans up empty paragraphs
 * - Normalizes whitespace artifacts
 */
export function sanitizeWPHtml(html: string): string {
  if (!html) return "";

  let clean = html;

  // ── Entity decoding (only in text, not in tags) ──
  // Process text between tags: decode entities
  clean = clean.replace(/>([^<]+)</g, (match, textContent) => {
    return ">" + decodeHTMLEntities(textContent) + "<";
  });

  // ── Clean up &nbsp; artifacts ──
  // Replace standalone &nbsp; with regular space (in text nodes)
  clean = clean.replace(/&nbsp;/gi, " ");

  // Replace unicode non-breaking spaces
  clean = clean.replace(/\u00A0/g, " ");

  // ── Remove empty / whitespace-only paragraphs ──
  clean = clean.replace(/<p[^>]*>\s*<\/p>/gi, "");
  clean = clean.replace(/<p[^>]*>(\s| )*<\/p>/gi, "");

  // ── Collapse excessive <br> tags (more than 2) ──
  clean = clean.replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />");

  // ── Collapse multiple blank lines ──
  clean = clean.replace(/\n{3,}/g, "\n\n");

  return clean;
}
