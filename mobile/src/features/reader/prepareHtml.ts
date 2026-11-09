/**
 * HTML preparation for the native reader. WordPress HTML arrives already
 * sanitised by the API (sanitizeWPHtml); these steps adapt it for
 * react-native-render-html:
 *   1. search highlighting (shared web helper, emits <mark>)
 *   2. memory-verse paragraphs → <blockquote class="memory"> (the web's
 *      formatMemoryTrack emits Tailwind/SVG markup that can't render natively)
 *   3. scripture references → <a href="scripture:…"> (tap opens the verse sheet;
 *      replaces the web's ScriptureProvider tooltips)
 */
import { highlightSearchInHtml, parseScriptureReference } from "~/shared";

export const SCRIPTURE_SCHEME = "scripture:";

const MEMORY_RE =
  /<p>\s*<(?:strong|b)>\s*(MEMORY TRACK|MEMORY VERSE|MEMORY VERSE \/ TRACK):\s*<\/(?:strong|b)>\s*([\s\S]*?)<\/p>/gi;

export function markMemoryVerse(html: string): string {
  return html.replace(
    MEMORY_RE,
    (_m, title: string, body: string) =>
      `<blockquote class="memory"><p class="memory-title">${title}</p><p>${body.trim()}</p></blockquote>`,
  );
}

// "John 3:16", "1 Cor. 13:1-3", "Rom 8:28–30", "Psalm 23" is left alone
// (chapter-only refs are too ambiguous in running text).
const REF_RE = /\b((?:[1-3]\s?)?[A-Z][a-zA-Z]+\.?(?:\s|&nbsp;)+\d{1,3}:\d{1,3}(?:\s?[-–]\s?\d{1,3}(?::\d{1,3})?)?)/g;

/** Wrap scripture references found in text nodes (never inside tags or existing links). */
export function linkScriptureRefs(html: string): string {
  const parts = html.split(/(<[^>]*>)/g);
  let linkDepth = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("<")) {
      if (/^<a[\s>]/i.test(part)) linkDepth++;
      else if (/^<\/a>/i.test(part)) linkDepth = Math.max(0, linkDepth - 1);
      continue;
    }
    if (linkDepth > 0 || !part) continue;
    parts[i] = part.replace(REF_RE, (match: string) => {
      const plain = match.replace(/&nbsp;/g, " ").replace(/–/g, "-");
      if (!parseScriptureReference(plain)) return match;
      return `<a href="${SCRIPTURE_SCHEME}${encodeURIComponent(plain)}">${match}</a>`;
    });
  }
  return parts.join("");
}

export function prepareHtml(html: string, opts: { query?: string; scripture?: boolean } = {}): string {
  let out = html || "";
  if (opts.query) out = highlightSearchInHtml(out, opts.query);
  out = markMemoryVerse(out);
  if (opts.scripture !== false) out = linkScriptureRefs(out);
  return out;
}
