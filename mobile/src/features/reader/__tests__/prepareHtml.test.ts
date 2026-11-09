import { linkScriptureRefs, markMemoryVerse, prepareHtml, SCRIPTURE_SCHEME } from "../prepareHtml";

describe("linkScriptureRefs", () => {
  it("links references in text", () => {
    const out = linkScriptureRefs("<p>Read John 3:16 today.</p>");
    expect(out).toContain(`<a href="${SCRIPTURE_SCHEME}${encodeURIComponent("John 3:16")}">John 3:16</a>`);
  });

  it("handles numbered books, abbreviations and ranges", () => {
    const out = linkScriptureRefs("<p>See 1 Cor. 13:1-3 and Rom 8:28–30.</p>");
    expect(out).toContain(">1 Cor. 13:1-3</a>");
    expect(out).toContain(">Rom 8:28–30</a>");
  });

  it("never touches tag attributes or existing links", () => {
    const html = '<a href="https://x.test/John 3:16">John 3:16</a><img alt="John 3:16">';
    expect(linkScriptureRefs(html)).toBe(html);
  });

  it("leaves non-references alone", () => {
    const html = "<p>Service starts at 10:30 on Sunday.</p>";
    expect(linkScriptureRefs(html)).toBe(html);
  });
});

describe("markMemoryVerse", () => {
  it("wraps memory-track paragraphs", () => {
    const out = markMemoryVerse("<p><strong>MEMORY TRACK:</strong> Be still, and know.</p>");
    expect(out).toBe(
      '<blockquote class="memory"><p class="memory-title">MEMORY TRACK</p><p>Be still, and know.</p></blockquote>',
    );
  });
});

describe("prepareHtml", () => {
  it("highlights the search query", () => {
    expect(prepareHtml("<p>grace and peace</p>", { query: "grace", scripture: false })).toContain("<mark");
  });
});
