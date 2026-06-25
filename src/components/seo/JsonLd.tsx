import React from "react";

type JsonLdData = Record<string, unknown>;

/**
 * Renders one or more JSON-LD structured-data blocks. Server component — the
 * data is generated from our own server-side content, so it is safe to inline.
 */
export default function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
