/**
 * Word (.docx) → editor HTML, for importing a Sunday School manual into the
 * admin RichTextEditor instead of retyping or pasting it.
 *
 * A .docx stores real structure (headings, paragraphs, bold/italic, lists,
 * tables), which mammoth converts to clean semantic HTML — no fonts, colours
 * or Office markup. Conversion runs entirely in the admin's browser; the file
 * is never uploaded. Images are left out (the editor has no image support,
 * and inlining them would bloat the post) and counted so the admin is told.
 */

/** Largest file accepted — a text manual is typically well under 1 MB. */
export const MAX_DOCX_BYTES = 15 * 1024 * 1024;

export interface DocxImportResult {
  /** Body HTML, ready for the editor. */
  html: string;
  /** The manual's TOPIC line, if the document has one. */
  title?: string;
  /** Images in the document that were not imported. */
  skippedImages: number;
}

/**
 * Word paragraph styles → HTML, beyond mammoth's defaults (which already map
 * Heading 1–6, lists, bold, italic, underline and tables).
 */
const STYLE_MAP = [
  "p[style-name='Title'] => h2:fresh",
  "p[style-name='Subtitle'] => h3:fresh",
  "p[style-name='Quote'] => blockquote > p:fresh",
  "p[style-name='Intense Quote'] => blockquote > p:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
];

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** Plain text of an HTML fragment. */
function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&(?:amp|lt|gt|quot|nbsp|#39);/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tidy mammoth's output for the editor: drop Word bookmark anchors
 * (`<a id="_Toc…"></a>`), image placeholders and empty paragraphs/headings.
 */
export function cleanImportedHtml(html: string): string {
  return html
    .replace(/<a id="[^"]*"><\/a>/g, "")
    .replace(/<img\b[^>]*>/g, "")
    .replace(/<(p|h[1-6])>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>/g, "")
    .trim();
}

/**
 * The manual's title from its "TOPIC: …" line — every manual opens with
 * THEME / LESSON / TOPIC / TEXT lines, and the TOPIC is the post title.
 */
export function extractManualTitle(html: string): string | undefined {
  const blocks = html.split(/<\/(?:p|h[1-6]|li)>/i);
  for (const block of blocks.slice(0, 15)) {
    const m = textOf(block).match(/^TOPIC\s*:\s*(.+)$/i);
    if (m && m[1].trim()) return m[1].trim();
  }
  return undefined;
}

/** Convert a .docx file. Throws an Error with a user-facing message. */
export async function convertDocx(file: File): Promise<DocxImportResult> {
  if (!/\.docx$/i.test(file.name)) {
    throw new Error(
      /\.doc$/i.test(file.name)
        ? "Old .doc files aren't supported — open it in Word and use File → Save As → Word Document (.docx)."
        : "Choose a Word document (.docx).",
    );
  }
  if (file.size > MAX_DOCX_BYTES) {
    throw new Error("That file is over 15 MB — is it a text manual?");
  }

  // Loaded on demand so the admin bundle only pays for it when importing.
  const mammoth = await import("mammoth");
  let skippedImages = 0;

  // mammoth's browser build reads `arrayBuffer`; its Node build (used by the
  // tests) reads `buffer`. Both hand the bytes to the same zip reader, so
  // passing them under both names works everywhere.
  const bytes = await file.arrayBuffer();
  const input = { arrayBuffer: bytes, buffer: bytes } as unknown as {
    arrayBuffer: ArrayBuffer;
  };

  const result = await mammoth.convertToHtml(input, {
    styleMap: STYLE_MAP,
    convertImage: mammoth.images.imgElement(async () => {
      skippedImages++;
      return { src: "" };
    }),
  });

  const html = cleanImportedHtml(result.value);
  if (!textOf(html)) {
    throw new Error("No text found in that document.");
  }
  return { html, title: extractManualTitle(html), skippedImages };
}
