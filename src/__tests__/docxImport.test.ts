import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import {
  convertDocx,
  cleanImportedHtml,
  extractManualTitle,
} from "@/utils/docxImport";
import { htmlToGutenbergBlocks } from "@/lib/gutenberg";

// ── Build a minimal real .docx, shaped like a Sunday School manual ──────────

const W =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const run = (text: string, bold = false) =>
  `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${text}</w:t></w:r>`;
const para = (runs: string, style?: string) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}${runs}</w:p>`;
const label = (name: string, value: string) =>
  para(run(name, true) + run(`: ${value}`));

async function makeDocx(bodyXml: string, name = "manual.docx"): Promise<File> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  );
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8"?><w:styles ${W}><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/></w:style></w:styles>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body>${bodyXml}</w:body></w:document>`,
  );
  const bytes = await zip.generateAsync({ type: "arraybuffer" });
  return new File([bytes], name, {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

const MANUAL = [
  label("THEME", "Understanding Salvation: Inheriting Incorruptible Nature"),
  label("LESSON", "Six"),
  label("TOPIC", "The Usefulness of Salvation &amp; the New Man – Part 3"),
  label("TEXT", "Galatians 5:16-25; Matthew 7:16-20"),
  para(""), // empty paragraph — should be dropped
  para(run("MEMORY TRACK:"), "Heading3"),
  para(run("In our last lesson we learned by the grace of God…")),
].join("");

describe("convertDocx", () => {
  it("converts a manual and takes the title from the TOPIC line", async () => {
    const result = await convertDocx(await makeDocx(MANUAL));

    expect(result.title).toBe(
      "The Usefulness of Salvation & the New Man – Part 3",
    );
    expect(result.skippedImages).toBe(0);
    // Labels stay bold, as on the published manuals.
    expect(result.html).toContain(
      "<p><strong>THEME</strong>: Understanding Salvation",
    );
    expect(result.html).toContain("<h3>MEMORY TRACK:</h3>");
    expect(result.html).toContain("<p>In our last lesson we learned");
    // Empty paragraphs are dropped.
    expect(result.html).not.toMatch(/<p>\s*<\/p>/);

    // …and it saves to WordPress as native blocks, like a typed manual.
    const blocks = htmlToGutenbergBlocks(result.html);
    expect(blocks).toContain('<!-- wp:heading {"level":3} -->');
    expect(blocks).toContain("<!-- wp:paragraph -->");
    expect(blocks).not.toContain("<!-- wp:html -->");
  });

  it("rejects legacy .doc files with a how-to-fix message", async () => {
    const doc = new File(["x"], "manual.doc");
    await expect(convertDocx(doc)).rejects.toThrow(/Save As/);
  });

  it("rejects a document with no text", async () => {
    await expect(convertDocx(await makeDocx(para("")))).rejects.toThrow(
      /No text/,
    );
  });
});

describe("cleanImportedHtml", () => {
  it("drops bookmarks, images and empty blocks", () => {
    expect(
      cleanImportedHtml(
        '<h2><a id="_Toc1"></a>Intro</h2><p></p><p><img src="" /></p><p>Body</p>',
      ),
    ).toBe("<h2>Intro</h2><p>Body</p>");
  });
});

describe("extractManualTitle", () => {
  it("is undefined when there is no TOPIC line", () => {
    expect(extractManualTitle("<p>Just some text</p>")).toBeUndefined();
  });
});
