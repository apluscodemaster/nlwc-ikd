/**
 * HTML → WordPress (Gutenberg) block serializer — server-safe, no DOM.
 *
 * Why this exists
 * ---------------
 * The admin RichTextEditor is a `contentEditable` surface driven by
 * `document.execCommand`, so it emits plain HTML. Posting that raw HTML to the
 * WordPress REST `content` field makes WordPress store it as a single "Classic"
 * (freeform) block, which has two bad consequences:
 *
 *   1. Editors opening the post in WP land in the legacy editor (one big
 *      Classic block) and must "Convert to blocks" before it behaves normally.
 *   2. On render, WordPress runs `wpautop()` over the freeform HTML, injecting
 *      <p>/<br> around and inside existing tags — which mangles paragraphs,
 *      spacing and alignment on the public site.
 *
 * Wrapping each top-level element in Gutenberg block delimiters
 * (`<!-- wp:paragraph -->…<!-- /wp:paragraph -->`, etc.) makes WordPress store
 * native blocks and skip `wpautop`, fixing both problems.
 *
 * This runs inside the Node API routes, where there is no DOM and `jsdom` is a
 * dev-only dependency. The editor output is a flat list of block elements, so a
 * small tag scanner (rather than a full HTML parser) is sufficient and keeps the
 * routes dependency-free.
 */

/** Top-level tags the editor can emit as distinct blocks. */
const BLOCK_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "ul",
  "ol",
  "pre",
  "hr",
  "figure",
  "table",
]);

/** Block-level open-tag detector — used to spot an inline wrapper that illegally
 *  spans block elements (the classic Word / Google Docs "bold everything"
 *  paste, where the whole selection is inside one <b>/<span>). */
const BLOCK_OPEN_RE = /<(?:p|h[1-6]|blockquote|ul|ol|pre|figure|table|hr|div)\b/i;

/** Inline emphasis / formatting tags that carry styling but never define a
 *  block. When one of these wraps block-level elements it is a paste artifact
 *  to unwrap rather than a real block. */
const INLINE_WRAPPER_TAGS = new Set([
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "mark",
  "span",
  "small",
  "sub",
  "sup",
]);

/** Normalise legacy/execCommand cruft before scanning for blocks. */
function preClean(html: string): string {
  return (
    html
      .replace(/\r/g, "")
      // legacy emphasis tags → semantic equivalents
      .replace(/<\s*b\s*>/gi, "<strong>")
      .replace(/<\s*\/\s*b\s*>/gi, "</strong>")
      .replace(/<\s*i\s*>/gi, "<em>")
      .replace(/<\s*\/\s*i\s*>/gi, "</em>")
      // <font> carries only presentational cruft
      .replace(/<\s*font[^>]*>/gi, "")
      .replace(/<\s*\/\s*font\s*>/gi, "")
      // strip class/id attributes (execCommand + pasted markup)
      .replace(/\s(?:class|id)="[^"]*"/gi, "")
      // normalise <br> variants
      .replace(/<\s*br\s*\/?\s*>/gi, "<br>")
      // contentEditable often wraps lines in <div>; treat as paragraphs
      .replace(/<\s*div(\s[^>]*)?>/gi, "<p>")
      .replace(/<\s*\/\s*div\s*>/gi, "</p>")
      // collapse accidental paragraph nesting produced by the div→p swap
      .replace(/<p>\s*<p>/gi, "<p>")
      .replace(/<\/p>\s*<\/p>/gi, "</p>")
  );
}

/** Read a block's text-align intent from its opening tag (style or attribute). */
function alignFromOpenTag(openTag: string): string | null {
  const style = /text-align:\s*(left|center|right|justify)/i.exec(openTag);
  if (style) return style[1].toLowerCase();
  const attr = /\balign="(left|center|right|justify)"/i.exec(openTag);
  return attr ? attr[1].toLowerCase() : null;
}

/** Strip inline-only cruft from a block's inner HTML, keeping real formatting. */
function cleanInner(html: string): string {
  return html
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\salign="[^"]*"/gi, "")
    .replace(/<span(\s[^>]*)?>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/ /g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/(?:<br>\s*)+$/gi, "")
    .trim();
}

/** Return the index just past the `</tag>` that matches the one opening at `start`. */
function findMatchingClose(html: string, start: number, tag: string): number {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>|<\\/${tag}\\s*>`, "gi");
  re.lastIndex = start;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[0][1] === "/") {
      depth--;
      if (depth === 0) return m.index + m[0].length;
    } else {
      depth++;
    }
  }
  return -1;
}

/** Split the (pre-cleaned) HTML into top-level element / text chunks. */
function splitTopLevel(html: string): string[] {
  const nodes: string[] = [];
  const n = html.length;
  let i = 0;

  while (i < n) {
    if (/\s/.test(html[i])) {
      i++;
      continue;
    }

    if (html[i] === "<" && html[i + 1] !== "/") {
      const tagMatch = /^<([a-zA-Z0-9]+)(?:\s[^>]*)?>/.exec(html.slice(i));
      if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        // void top-level elements
        if (tag === "br" || tag === "hr" || tag === "img") {
          const end = html.indexOf(">", i) + 1;
          nodes.push(html.slice(i, end));
          i = end;
          continue;
        }
        const close = findMatchingClose(html, i, tag);
        if (close !== -1) {
          nodes.push(html.slice(i, close));
          i = close;
          continue;
        }
      }
    }

    // Text or inline run: consume until the next top-level BLOCK open tag.
    let j = i;
    while (j < n) {
      if (html[j] === "<") {
        const t = /^<([a-zA-Z0-9]+)(?:\s[^>]*)?>/.exec(html.slice(j));
        if (t && BLOCK_TAGS.has(t[1].toLowerCase())) break;
      }
      j++;
    }
    const chunk = html.slice(i, j).trim();
    if (chunk) nodes.push(chunk);
    i = j > i ? j : i + 1; // guard against zero-width progress
  }

  return nodes;
}

/** `<tag …>inner</tag>` → `inner`. */
function innerHtml(node: string, tag: string): string {
  return node
    .replace(new RegExp(`^<${tag}(?:\\s[^>]*)?>`, "i"), "")
    .replace(new RegExp(`<\\/${tag}\\s*>$`, "i"), "");
}

function paragraphBlock(inner: string, align: string | null): string {
  if (align === "center" || align === "right") {
    return (
      `<!-- wp:paragraph {"align":"${align}"} -->\n` +
      `<p class="has-text-align-${align}">${inner}</p>\n` +
      `<!-- /wp:paragraph -->`
    );
  }
  return `<!-- wp:paragraph -->\n<p>${inner}</p>\n<!-- /wp:paragraph -->`;
}

function headingBlock(
  level: number,
  inner: string,
  align: string | null,
): string {
  const lvl = level >= 1 && level <= 6 ? level : 2;
  const attrs: string[] = [];
  if (lvl !== 2) attrs.push(`"level":${lvl}`);
  const aligned = align === "center" || align === "right";
  if (aligned) attrs.push(`"textAlign":"${align}"`);
  const attrStr = attrs.length ? ` {${attrs.join(",")}}` : "";
  const cls = aligned ? ` class="has-text-align-${align}"` : "";
  return (
    `<!-- wp:heading${attrStr} -->\n` +
    `<h${lvl}${cls}>${inner}</h${lvl}>\n` +
    `<!-- /wp:heading -->`
  );
}

function quoteBlock(inner: string): string {
  const paras = inner.match(/<p(?:\s[^>]*)?>[\s\S]*?<\/p>/gi);
  const source = paras && paras.length ? paras : [`<p>${inner}</p>`];
  const nested = source
    .map((p) => {
      const pInner = cleanInner(innerHtml(p, "p"));
      return `<!-- wp:paragraph -->\n<p>${pInner}</p>\n<!-- /wp:paragraph -->`;
    })
    .join("\n");
  return `<!-- wp:quote -->\n<blockquote class="wp-block-quote">${nested}</blockquote>\n<!-- /wp:quote -->`;
}

function listBlock(inner: string, ordered: boolean): string {
  const items = inner.match(/<li(?:\s[^>]*)?>[\s\S]*?<\/li>/gi) || [];
  const lis = items
    .map((li) => {
      const liInner = cleanInner(innerHtml(li, "li"));
      return `<!-- wp:list-item -->\n<li>${liInner}</li>\n<!-- /wp:list-item -->`;
    })
    .join("\n");
  const tag = ordered ? "ol" : "ul";
  const attr = ordered ? ' {"ordered":true}' : "";
  return `<!-- wp:list${attr} -->\n<${tag} class="wp-block-list">${lis}</${tag}>\n<!-- /wp:list -->`;
}

/** Serialize a single top-level chunk into a Gutenberg block. */
function serializeNode(node: string): string {
  const m = /^<([a-zA-Z0-9]+)(?:\s[^>]*)?>/.exec(node);

  // Bare text / inline run → paragraph
  if (!m) {
    const inner = cleanInner(node);
    return inner ? paragraphBlock(inner, null) : "";
  }

  const tag = m[1].toLowerCase();

  // An inline element (<strong>/<b>/<span …>) sitting at the top level. Word /
  // Google Docs pastes routinely wrap the whole selection — or a run spanning
  // several paragraphs — in one such tag. Left alone, splitTopLevel treats that
  // wrapper as ONE node and it lands in the `default` branch below as a raw
  // wp:html block, so the frontend renders the ENTIRE manual bold and wpautop
  // mangles the nested <p> tags into a stray "p>". Handle it here instead:
  //   • wrapper around block elements → unwrap and serialize the inner blocks
  //   • leaf inline run (no blocks inside) → a normal paragraph that keeps the
  //     emphasis
  if (INLINE_WRAPPER_TAGS.has(tag)) {
    const innerRaw = innerHtml(node, tag);
    if (BLOCK_OPEN_RE.test(innerRaw)) {
      return splitTopLevel(innerRaw)
        .map(serializeNode)
        .filter(Boolean)
        .join("\n\n");
    }
    const leaf = cleanInner(node);
    return leaf ? paragraphBlock(leaf, null) : "";
  }

  const align = alignFromOpenTag(m[0]);
  const inner = cleanInner(innerHtml(node, tag));

  switch (tag) {
    case "p":
      return inner ? paragraphBlock(inner, align) : "";
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return inner ? headingBlock(Number(tag[1]), inner, align) : "";
    case "blockquote":
      return inner ? quoteBlock(inner) : "";
    case "ul":
      return listBlock(inner, false);
    case "ol":
      return listBlock(inner, true);
    case "hr":
      return '<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->';
    default:
      // Unknown block (table/figure/pre/…): preserve it verbatim in an HTML
      // block so nothing is lost and wpautop still leaves it alone.
      return `<!-- wp:html -->\n${node}\n<!-- /wp:html -->`;
  }
}

/**
 * Convert the editor's raw HTML into Gutenberg block markup.
 *
 * Returns "" for empty input. Never throws: on any unexpected shape it falls
 * back to wrapping the whole input in a single paragraph block so content is
 * never silently dropped.
 */
export function htmlToGutenbergBlocks(rawHtml: string): string {
  if (!rawHtml || !rawHtml.trim()) return "";

  try {
    const cleaned = preClean(rawHtml);
    const blocks = splitTopLevel(cleaned)
      .map(serializeNode)
      .filter(Boolean);

    if (blocks.length) return blocks.join("\n\n");

    // Nothing parsed but there was input — wrap the plain text as a paragraph.
    const fallback = cleanInner(cleaned);
    return fallback ? paragraphBlock(fallback, null) : "";
  } catch {
    const fallback = cleanInner(rawHtml);
    return fallback ? paragraphBlock(fallback, null) : "";
  }
}
