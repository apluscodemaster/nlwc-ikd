import { describe, it, expect } from "vitest";
import { htmlToGutenbergBlocks } from "@/lib/gutenberg";

/** Text content of the serialized blocks, tags stripped — easier to assert on. */
const text = (html: string) =>
  htmlToGutenbergBlocks(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

describe("htmlToGutenbergBlocks", () => {
  it("does not leak a stray 'p>' when paragraphs are unbalanced", () => {
    // contentEditable nests <div>s, which the div→p rewrite turns into nested
    // paragraphs. The old scanner dropped the leading "<" and emitted "p>A".
    for (const input of [
      "<div>A<div>B</div></div>",
      "<p>A<p>B</p>",
      "<div><div>A</div></div>",
    ]) {
      // The artifact is a "p>" in the *text*, i.e. once tags are stripped.
      expect(text(input)).not.toMatch(/\bp>/);
    }
  });

  it("flattens nested paragraphs into sibling blocks", () => {
    expect(htmlToGutenbergBlocks("<div>A<div>B</div></div>")).toBe(
      "<!-- wp:paragraph -->\n<p>A</p>\n<!-- /wp:paragraph -->\n\n" +
        "<!-- wp:paragraph -->\n<p>B</p>\n<!-- /wp:paragraph -->",
    );
  });

  it("drops the Google Docs <b style=font-weight:normal> wrapper", () => {
    // The style is the only thing keeping that <b> from rendering bold, and
    // inline styles are stripped downstream — keeping the tag bolded the whole
    // manual.
    const out = htmlToGutenbergBlocks(
      '<b style="font-weight:normal" id="docs-internal-guid-1">Hello world</b>',
    );
    expect(out).not.toMatch(/<(?:b|strong)\b/);
    expect(text(out)).toBe("Hello world");
  });

  it("unwraps a neutralised wrapper around block elements", () => {
    const out = htmlToGutenbergBlocks(
      '<b style="font-weight:normal" id="d">' +
        '<p dir="ltr"><span>Para one</span></p>' +
        '<p dir="ltr"><span>Para two</span></p></b>',
    );
    expect(out).not.toMatch(/<(?:b|strong)\b/);
    expect(out).not.toContain("</strong>");
    expect(text(out)).toBe("Para one Para two");
  });

  it("keeps emphasis open/close tags balanced when <b> carries attributes", () => {
    // Rewriting every </b> but only the bare <b> produced "<b>…</strong>",
    // leaving an unclosed <b> that bolded everything after it.
    const out = htmlToGutenbergBlocks('<p><b title="x">bold</b> normal</p>');
    const opens = (out.match(/<strong>/g) || []).length;
    const closes = (out.match(/<\/strong>/g) || []).length;
    expect(opens).toBe(closes);
    expect(out).not.toMatch(/<b[\s>]/);
    expect(text(out)).toBe("bold normal");
  });

  it("never emits an orphan closing tag", () => {
    const out = htmlToGutenbergBlocks("</strong><p>Body</p>");
    expect(out).not.toContain("</strong>");
    expect(text(out)).toBe("Body");
  });

  it("preserves genuine emphasis", () => {
    const out = htmlToGutenbergBlocks("<p>plain <strong>bold</strong></p>");
    expect(out).toContain("<strong>bold</strong>");
  });

  it("serializes the typical typed-editor output", () => {
    expect(
      htmlToGutenbergBlocks(
        "First line<div>Second</div><div><br></div><div>Third</div>",
      ),
    ).toBe(
      "<!-- wp:paragraph -->\n<p>First line</p>\n<!-- /wp:paragraph -->\n\n" +
        "<!-- wp:paragraph -->\n<p>Second</p>\n<!-- /wp:paragraph -->\n\n" +
        "<!-- wp:paragraph -->\n<p>Third</p>\n<!-- /wp:paragraph -->",
    );
  });

  it("keeps headings, lists and quotes as native blocks", () => {
    const out = htmlToGutenbergBlocks(
      "<h3>Lesson</h3><ul><li>One</li><li>Two</li></ul><blockquote><p>Quoted</p></blockquote>",
    );
    expect(out).toContain('<!-- wp:heading {"level":3} -->');
    expect(out).toContain("<!-- wp:list -->");
    expect(out).toContain("<!-- wp:list-item -->");
    expect(out).toContain("<!-- wp:quote -->");
  });

  it("returns empty string for empty input", () => {
    expect(htmlToGutenbergBlocks("")).toBe("");
    expect(htmlToGutenbergBlocks("   ")).toBe("");
  });
});
