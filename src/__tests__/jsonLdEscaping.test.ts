import { describe, it, expect } from "vitest";

/**
 * Regression test for a JSON-LD script-breakout XSS.
 *
 * JSON.stringify does not escape "</script>". These blocks embed WordPress
 * titles/excerpts, so a crafted post title could close the tag early and have
 * the remainder parsed as HTML — stored XSS on every page rendering that block.
 *
 * Mirrors toInlineJson() in components/seo/JsonLd.tsx.
 */
const toInlineJson = (block: Record<string, unknown>): string =>
  JSON.stringify(block).replace(/</g, "\\u003c");

describe("JSON-LD inline serialization", () => {
  it("plain JSON.stringify IS vulnerable (documents why the escape exists)", () => {
    const evil = { headline: "Sermon</script><img src=x onerror=alert(1)>" };
    expect(JSON.stringify(evil)).toContain("</script>");
  });

  it("escapes the closing tag so it cannot break out", () => {
    const evil = { headline: "Sermon</script><img src=x onerror=alert(1)>" };
    const out = toInlineJson(evil);
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<img");
  });

  it("round-trips to the identical value (escaping must not corrupt data)", () => {
    const evil = { headline: "Sermon</script><img src=x onerror=alert(1)>" };
    expect(JSON.parse(toInlineJson(evil))).toEqual(evil);
  });

  it("leaves ordinary structured data intact", () => {
    const normal = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "The Power of Faith",
      url: "https://ikorodu.nlwc.church/transcripts/faith",
    };
    expect(JSON.parse(toInlineJson(normal))).toEqual(normal);
  });
});
