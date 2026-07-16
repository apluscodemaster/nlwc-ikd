import React from "react";

type JsonLdData = Record<string, unknown>;

/**
 * Serialize for inlining inside a <script> tag.
 *
 * JSON.stringify does NOT escape "</script>", so any string in the payload that
 * contains it terminates the tag early and the remainder is parsed as HTML:
 *
 *   {"headline":"Sermon</script><img src=x onerror=alert(1)>"}
 *
 * These blocks carry WordPress titles/excerpts, so the content is not ours to
 * trust — a crafted post title would become stored XSS on every page embedding
 * it. Escaping every "<" to its unicode form is valid JSON (it round-trips to
 * the identical value) and makes the breakout impossible.
 */
function toInlineJson(block: JsonLdData): string {
  return JSON.stringify(block).replace(/</g, "\\u003c");
}

/** Renders one or more JSON-LD structured-data blocks. */
export default function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toInlineJson(block) }}
        />
      ))}
    </>
  );
}
