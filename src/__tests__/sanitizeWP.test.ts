import { describe, expect, it } from "vitest";
import { sanitizeWPHtml, sanitizeHtmlAllowList } from "@/utils/sanitizeWP";

describe("sanitizeWPHtml: script can't survive", () => {
  it.each([
    ["script tag", `<p>Hi</p><script>alert(1)</script>`],
    ["event handler", `<img src="/a.jpg" onerror="alert(1)">`],
    ["javascript: link", `<a href="javascript:alert(1)">x</a>`],
    ["entity-obfuscated scheme", `<a href="java&#115;cript:alert(1)">x</a>`],
    ["tab inside scheme", `<a href="java\tscript:alert(1)">x</a>`],
    ["svg onload", `<svg onload="alert(1)"><circle/></svg>`],
    ["unknown iframe", `<iframe src="https://evil.example/x"></iframe>`],
    ["javascript iframe", `<iframe src="javascript:alert(1)"></iframe>`],
    ["object", `<object data="x.swf"></object>`],
    ["style expression", `<p style="width: expression(alert(1))">x</p>`],
    ["upper-case tag", `<SCRIPT>alert(1)</SCRIPT>`],
    ["quoted > in attribute", `<img alt="a>b" src=x onerror=alert(1)>`],
  ])("%s", (_name, input) => {
    const out = sanitizeWPHtml(input);
    expect(out).not.toMatch(/<script|onerror|onload|javascript:|<svg|<object|expression\(|evil\.example/i);
  });

  it("keeps escaped text as text (WordPress's own escaping is not undone)", () => {
    const out = sanitizeWPHtml(`<p>&lt;img src=x onerror=alert(1)&gt;</p>`);
    expect(out).toBe(`<p>&lt;img src=x onerror=alert(1)&gt;</p>`);
  });

  it("escapes a stray < in text", () => {
    expect(sanitizeHtmlAllowList(`a < b and c > d`)).toBe(`a &lt; b and c &gt; d`);
  });
});

describe("sanitizeWPHtml: normal content is kept", () => {
  it("keeps structure, emphasis and safe links", () => {
    const html = `<h2>Title</h2><p><strong>Bold</strong> and <em>italic</em> <a href="https://bible.com/x?a=1&amp;b=2">link</a></p><ul><li>One</li></ul>`;
    expect(sanitizeWPHtml(html)).toBe(
      `<h2>Title</h2><p><strong>Bold</strong> and <em>italic</em> <a href="https://bible.com/x?a=1&amp;b=2">link</a></p><ul><li>One</li></ul>`,
    );
  });

  it("decodes typographic entities for display", () => {
    expect(sanitizeWPHtml(`<p>God&#8217;s grace &#8211; always&#8230;</p>`)).toBe(`<p>God’s grace – always…</p>`);
  });

  it("keeps images and relative links", () => {
    const out = sanitizeWPHtml(`<p><img src="/uploads/a.jpg" alt="A" width="300"><a href="/sermons/x">x</a></p>`);
    expect(out).toBe(`<p><img src="/uploads/a.jpg" alt="A" width="300"><a href="/sermons/x">x</a></p>`);
  });

  it("keeps YouTube embeds", () => {
    const out = sanitizeWPHtml(`<iframe src="https://www.youtube.com/embed/abc" allowfullscreen></iframe>`);
    expect(out).toBe(`<iframe src="https://www.youtube.com/embed/abc" allowfullscreen></iframe>`);
  });

  it("adds rel=noopener to links opening a new tab", () => {
    expect(sanitizeWPHtml(`<a href="https://x.org" target="_blank">x</a>`)).toBe(
      `<a href="https://x.org" target="_blank" rel="noopener noreferrer">x</a>`,
    );
  });

  it("keeps bold/alignment styles but drops fonts and colours", () => {
    expect(sanitizeWPHtml(`<p style="text-align: center; font-family: Arial; color: red">x</p>`)).toBe(
      `<p style="text-align: center">x</p>`,
    );
  });
});
