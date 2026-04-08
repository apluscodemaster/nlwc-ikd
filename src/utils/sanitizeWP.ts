/**
 * WordPress Content Sanitizer
 *
 * Cleans up HTML entities, special characters, and formatting artifacts
 * that come from the WordPress database/API.
 *
 * Use `sanitizeWPText()` for plain text (titles, excerpts) and
 * `sanitizeWPHtml()` for rich HTML content (post body).
 *
 * ⚡ Optimised for Vercel Serverless:
 *   - All regex patterns pre-compiled at module load (zero per-call cost)
 *   - Single combined regex replaces 28 individual entity loops
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

// ⚡ Pre-compile a SINGLE combined regex for all known entities (runs ONCE at module load)
const ENTITY_KEYS = Object.keys(HTML_ENTITIES).map((k) =>
  k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
);
const COMBINED_ENTITY_RE = new RegExp(ENTITY_KEYS.join("|"), "gi");

// ⚡ Pre-compile remaining regex patterns (runs ONCE at module load)
const NUMERIC_DECIMAL_ENTITY_RE = /&#(\d+);/g;
const NUMERIC_HEX_ENTITY_RE = /&#x([0-9a-fA-F]+);/g;
const NBSP_UNICODE_RE = /\u00A0/g;
const HTML_TAG_RE = /<[^>]*>/g;
const MULTI_SPACE_RE = /\s{2,}/g;
const TEXT_BETWEEN_TAGS_RE = />([^<]+)</g;
const NBSP_NAMED_RE = /&nbsp;/gi;
const EMPTY_PARAGRAPH_RE = /<p[^>]*>\s*<\/p>/gi;
const NBSP_PARAGRAPH_RE = /<p[^>]*>(\s|&nbsp;)*<\/p>/gi;
const EXCESSIVE_BR_RE = /(<br\s*\/?>[\s]*){3,}/gi;
const EXCESSIVE_NEWLINES_RE = /\n{3,}/g;

/**
 * Decode known HTML entities to their real characters.
 * ⚡ Uses a single pre-compiled regex instead of 28 individual loops.
 */
function decodeHTMLEntities(text: string): string {
  // Single-pass replacement for all known entities
  let result = text.replace(
    COMBINED_ENTITY_RE,
    (match) => HTML_ENTITIES[match.toLowerCase()] ?? HTML_ENTITIES[match] ?? match,
  );

  // Catch any remaining numeric HTML entities (decimal)  &#123;
  result = result.replace(NUMERIC_DECIMAL_ENTITY_RE, (_, code) => {
    const num = parseInt(code, 10);
    return num > 0 ? String.fromCharCode(num) : "";
  });

  // Catch any remaining hex HTML entities  &#x1F4A9;
  result = result.replace(NUMERIC_HEX_ENTITY_RE, (_, hex) => {
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
  clean = clean.replace(NBSP_UNICODE_RE, " ");

  // Strip any remaining HTML tags
  clean = clean.replace(HTML_TAG_RE, "");

  // Collapse multiple spaces into one
  clean = clean.replace(MULTI_SPACE_RE, " ");

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
  clean = clean.replace(TEXT_BETWEEN_TAGS_RE, (match, textContent) => {
    return ">" + decodeHTMLEntities(textContent) + "<";
  });

  // ── Clean up &nbsp; artifacts ──
  // Replace standalone &nbsp; with regular space (in text nodes)
  clean = clean.replace(NBSP_NAMED_RE, " ");

  // Replace unicode non-breaking spaces
  clean = clean.replace(NBSP_UNICODE_RE, " ");

  // ── Remove empty / whitespace-only paragraphs ──
  clean = clean.replace(EMPTY_PARAGRAPH_RE, "");
  clean = clean.replace(NBSP_PARAGRAPH_RE, "");

  // ── Collapse excessive <br> tags (more than 2) ──
  clean = clean.replace(EXCESSIVE_BR_RE, "<br /><br />");

  // ── Collapse multiple blank lines ──
  clean = clean.replace(EXCESSIVE_NEWLINES_RE, "\n\n");

  return clean;
}
