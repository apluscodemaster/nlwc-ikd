"use client";

import React, { useRef } from "react";
import { sanitizeWPHtml } from "@/utils/sanitizeWP";
import { ScriptureProvider } from "@/components/providers/ScriptureProvider";

interface ScriptureContentProps {
  content: string;
  className?: string;
}

/**
 * Renders HTML content with prose styling and interactive scripture references.
 *
 * It carries its OWN scoped ScriptureProvider, so every consumer — the
 * transcript/manual/sermon detail pages, the transcript overlay and the quiz
 * drawer — gets the same in-app KJV tooltip with no extra wiring. That matters
 * because the `no-reftagger` class below opts this content out of Logos
 * RefTagger entirely; if a page rendered this without a provider, its scripture
 * would simply stop being tagged.
 *
 * Why in-app instead of RefTagger: RefTagger positions its popup in DOCUMENT
 * space, which breaks inside a `position: fixed` overlay, and it was showing a
 * different translation (WEB) than the rest of the site (KJV).
 */
export default function ScriptureContent({
  content,
  className = "",
}: ScriptureContentProps) {
  // Clean up WordPress content artifacts (entities, empty paragraphs, excess whitespace)
  const cleanedContent = sanitizeWPHtml(content);
  const scopeRef = useRef<HTMLDivElement>(null);

  return (
    <ScriptureProvider scopeRef={scopeRef}>
    <div
      ref={scopeRef}
      data-scripture-content="true"
      className={`no-reftagger prose prose-sm sm:prose-base md:prose-lg prose-gray max-w-none text-justify
        prose-headings:font-bold prose-headings:text-gray-900 prose-headings:text-left
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-justify
        prose-strong:text-gray-900
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
        prose-ul:my-4 prose-ul:pl-6 prose-ul:list-disc
        prose-ol:my-4 prose-ol:pl-6 prose-ol:list-decimal
        prose-li:text-gray-700 prose-li:text-justify prose-li:my-2
        wrap-break-word
        [&_p:empty]:hidden [&_p:empty+br]:hidden
        [&_p]:mb-4 [&_p]:mt-0
        [&_br+br+br]:hidden
        ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanedContent }}
    />
    </ScriptureProvider>
  );
}

/**
 * Wrapper component for prose content that processes scripture references
 * with custom accent color support
 */
export function ScriptureProseContent({
  content,
  className = "",
}: ScriptureContentProps) {
  return <ScriptureContent content={content} className={className} />;
}
