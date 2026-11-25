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
const NBSP_NAMED_RE = /&nbsp;/gi;
const EMPTY_PARAGRAPH_RE = /<p[^>]*>\s*<\/p>/gi;
const NBSP_PARAGRAPH_RE = /<p[^>]*>(\s|&nbsp;)*<\/p>/gi;
const EXCESSIVE_BR_RE = /(<br\s*\/?>[\s]*){3,}/gi;
const EXCESSIVE_NEWLINES_RE = /\n{3,}/g;

// ─── External "core" formatting stripping ─────────────────────────────────────
// Content pasted from Word / Google Docs carries inline styles (font-family,
// colors, sizes, line-height, mso-* …) that override the app's own typography.
// We strip those so the app's font/colors win, while KEEPING structural and
// emphasis properties (font-weight, font-style, text-align, text-decoration,
// vertical-align) so bold/italic/alignment from the source survive.
const BLOCKED_STYLE_PROP_RE =
  /^(?:font-family|font-size|font|font-variant|font-feature-settings|font-stretch|color|background|background-color|background-image|line-height|letter-spacing|word-spacing|text-shadow|mso-[\w-]+|-webkit-[\w-]+|-moz-[\w-]+)$/i;

// Matches a style="…" / style='…' attribute (with its leading whitespace).
const STYLE_ATTR_RE = /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

// Office / external paste artifacts that carry their own fonts and must be
// removed entirely (a <style> block can set font-family on classes, and <font>
// tags carry a face= font) so the app's typography applies.
const STYLE_BLOCK_RE = /<style[\s\S]*?<\/style>/gi;
const FONT_TAG_RE = /<\/?font\b[^>]*>/gi;
const OFFICE_TAG_RE = /<\/?(?:o:p|xml|w:[a-z]+|m:[a-z]+|st1:[a-z]+)\b[^>]*>/gi;
const CONDITIONAL_COMMENT_RE = /<!--\[if[\s\S]*?endif\]-->/gi;

/**
 * Remove external formatting that overrides the app's typography: <style>
 * blocks, <font> tags, Office namespace tags / conditional comments, and the
 * blocked inline-style properties (via cleanInlineStyles).
 */
export function stripExternalFormatting(html: string): string {
  if (!html) return "";
  return cleanInlineStyles(
    html
      .replace(STYLE_BLOCK_RE, "")
      .replace(CONDITIONAL_COMMENT_RE, "")
      .replace(OFFICE_TAG_RE, "")
      .replace(FONT_TAG_RE, ""),
  );
}

/**
 * Remove blocked inline-style properties (font-family, color, size, line-height,
 * mso-*, …) from every `style` attribute in an HTML string, dropping the
 * attribute entirely when nothing useful is left. Keeps structural/emphasis
 * declarations so the app's typography applies but bold/italic/alignment remain.
 */
export function cleanInlineStyles(html: string): string {
  if (!html) return "";
  return html.replace(STYLE_ATTR_RE, (_m, dq?: string, sq?: string) => {
    const raw = dq ?? sq ?? "";
    const kept = raw
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .filter((decl) => {
        const colon = decl.indexOf(":");
        if (colon === -1) return false;
        const prop = decl.slice(0, colon).trim().toLowerCase();
        return prop !== "" && !BLOCKED_STYLE_PROP_RE.test(prop);
      });
    return kept.length ? ` style="${kept.join("; ")}"` : "";
  });
}

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

// ─── Allow-list HTML sanitizer ────────────────────────────────────────────────
// Post bodies are rendered with dangerouslySetInnerHTML on the main site, where
// the admin's Firebase session lives, so anything a WordPress author (or a
// compromised WP account/plugin) writes must not be able to run script. Only
// the tags and attributes below survive; everything else is dropped.

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em",
  "i", "u", "s", "strike", "del", "ins", "sub", "sup", "small", "mark", "abbr",
  "time", "blockquote", "q", "cite", "code", "pre", "kbd", "ul", "ol", "li",
  "dl", "dt", "dd", "a", "img", "figure", "figcaption", "picture", "source",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup",
  "col", "div", "span", "section", "article", "header", "footer", "aside",
  "audio", "video", "track", "iframe", "details", "summary", "center", "wbr",
]);

/** Dropped together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  "script", "style", "noscript", "template", "object", "embed", "applet",
  "frame", "frameset", "textarea", "select", "option", "title", "head", "xmp",
  "plaintext", "noembed", "noframes", "svg", "math", "iframe",
]);

const VOID_TAGS = new Set(["br", "hr", "img", "source", "track", "col", "wbr"]);

const ALLOWED_ATTRS = new Set([
  "class", "id", "style", "title", "lang", "dir", "align", "valign", "width",
  "height", "colspan", "rowspan", "scope", "headers", "alt", "href", "src",
  "srcset", "sizes", "target", "rel", "loading", "decoding", "controls",
  "preload", "poster", "allow", "allowfullscreen", "frameborder", "type",
  "start", "reversed", "datetime", "cite", "open", "kind", "srclang", "label",
  "role", "name",
]);

const URL_ATTRS = new Set(["href", "src", "cite", "poster"]);

/** Embeds WordPress posts are allowed to carry. */
const IFRAME_HOST_RE =
  /^(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|w\.soundcloud\.com|open\.spotify\.com|drive\.google\.com|docs\.google\.com|www\.google\.com|(?:www\.)?facebook\.com)$/i;

const TOKEN_RE =
  /<!--[\s\S]*?(?:-->|$)|<[!?][^>]*>?|<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTR_RE =
  /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const UNSAFE_STYLE_RE = /expression\s*\(|javascript:|vbscript:|behavior\s*:|-moz-binding|@import/i;

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

/** http(s), mailto, tel, same-site paths and anchors; never javascript: etc. */
function isSafeUrl(raw: string, allowDataImage = false): boolean {
  // Browsers ignore control characters and whitespace inside a scheme
  // ("java\tscript:"), so strip them before looking at it.
  const v = decodeHTMLEntities(raw)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000- \u007F]+/g, "")
    .toLowerCase();
  if (/^(?:https?:|mailto:|tel:)/.test(v)) return true;
  if (allowDataImage && /^data:image\/(?:png|jpe?g|gif|webp);/.test(v)) return true;
  // No scheme at all (relative URL): the first ':' must come after a / ? or #.
  const colon = v.indexOf(":");
  if (colon === -1) return true;
  const firstDelimiter = v.search(/[/?#]/);
  return firstDelimiter !== -1 && firstDelimiter < colon;
}

function isAllowedIframeSrc(raw: string): boolean {
  try {
    const url = new URL(decodeHTMLEntities(raw).trim());
    return url.protocol === "https:" && IFRAME_HOST_RE.test(url.hostname);
  } catch {
    return false;
  }
}

/** The kept attributes as ` name="value"`, or null for an iframe that must go. */
function sanitizeAttributes(tag: string, rawAttrs: string): string | null {
  const kept = new Map<string, string | null>();
  ATTR_RE.lastIndex = 0;
  for (let m = ATTR_RE.exec(rawAttrs); m; m = ATTR_RE.exec(rawAttrs)) {
    const name = m[1].toLowerCase();
    const raw = m[2] ?? m[3] ?? m[4];
    const value = raw === undefined ? null : decodeHTMLEntities(raw);
    if (kept.has(name) || name.startsWith("on")) continue;
    if (!ALLOWED_ATTRS.has(name) && !name.startsWith("data-") && !name.startsWith("aria-")) continue;
    if (URL_ATTRS.has(name)) {
      const ok =
        value !== null &&
        (tag === "iframe" && name === "src"
          ? isAllowedIframeSrc(value)
          : isSafeUrl(value, tag === "img" && name === "src"));
      if (!ok) continue;
    }
    if (
      name === "srcset" &&
      !(value ?? "").split(",").every((part) => isSafeUrl(part.trim().split(/\s+/)[0] ?? ""))
    ) {
      continue;
    }
    if (name === "style" && UNSAFE_STYLE_RE.test(value ?? "")) continue;
    kept.set(name, value);
  }
  if (tag === "iframe" && !kept.has("src")) return null;
  // A new tab must not get a handle on this page (window.opener).
  if (kept.get("target")?.toLowerCase() === "_blank") kept.set("rel", "noopener noreferrer");
  let out = "";
  for (const [name, value] of kept) {
    out += value === null ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`;
  }
  return out;
}

/**
 * Keep only allow-listed tags and attributes, drop script-capable content
 * (script/style/object/unknown iframes, on* handlers, javascript: URLs), and
 * leave every piece of text escaped. Text entities are decoded for display
 * except < > &, which stay escaped so encoded text can never become markup.
 */
export function sanitizeHtmlAllowList(html: string): string {
  if (!html) return "";
  let out = "";
  let last = 0;
  let skipUntil: string | null = null;
  const text = (s: string) => escapeText(decodeHTMLEntities(s));

  TOKEN_RE.lastIndex = 0;
  for (let m = TOKEN_RE.exec(html); m; m = TOKEN_RE.exec(html)) {
    const between = html.slice(last, m.index);
    last = TOKEN_RE.lastIndex;
    if (skipUntil) {
      if (m[1] === "/" && m[2]?.toLowerCase() === skipUntil) skipUntil = null;
      continue;
    }
    out += text(between);
    if (!m[2]) continue; // comment, <!doctype>, <?xml?>
    const tag = m[2].toLowerCase();
    const closing = m[1] === "/";
    const selfClosing = /\/\s*$/.test(m[3]);

    if (tag === "iframe" && !closing) {
      const attrs = sanitizeAttributes(tag, m[3]);
      if (attrs !== null) {
        out += `<iframe${attrs}></iframe>`;
      }
      if (!selfClosing) skipUntil = "iframe";
      continue;
    }
    if (DROP_WITH_CONTENT.has(tag)) {
      if (!closing && !selfClosing) skipUntil = tag;
      continue;
    }
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (closing) {
      if (!VOID_TAGS.has(tag)) out += `</${tag}>`;
      continue;
    }
    out += `<${tag}${sanitizeAttributes(tag, m[3]) ?? ""}>`;
  }
  if (!skipUntil) out += text(html.slice(last));
  return out;
}

/**
 * Sanitize rich HTML content from WordPress (post body).
 *
 * - Allow-list sanitizes tags and attributes (no script can survive)
 * - Decodes HTML entities in text for display, keeping < > & escaped
 * - Removes excessive &nbsp; sequences
 * - Cleans up empty paragraphs
 * - Normalizes whitespace artifacts
 */
export function sanitizeWPHtml(html: string): string {
  if (!html) return "";

  let clean = html;

  // ── Strip external formatting (font-family, color, size, mso-*, <style>
  // blocks, <font> tags, Office cruft) so the app's typography controls the
  // look, while keeping structure (headings, paragraphs, lists, emphasis).
  clean = stripExternalFormatting(clean);

  // ── Security: allow-listed tags/attributes only, text kept escaped ──
  clean = sanitizeHtmlAllowList(clean);

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
