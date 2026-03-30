"use client";

import React from "react";
import { sanitizeWPHtml } from "@/utils/sanitizeWP";

interface ScriptureContentProps {
  content: string;
  className?: string;
}

/**
 * Component that renders HTML content with prose styling.
 * Scripture references are automatically detected and made interactive
 * by the global ScriptureProvider.
 *
 * Use the `data-scripture-content` attribute to enable automatic
 * scripture reference detection on any element.
 */
export default function ScriptureContent({
  content,
  className = "",
}: ScriptureContentProps) {
  // Clean up WordPress content artifacts (entities, empty paragraphs, excess whitespace)
  const cleanedContent = sanitizeWPHtml(content);

  return (
    <div
      data-scripture-content="true"
      className={`prose prose-sm sm:prose-base md:prose-lg prose-gray max-w-none text-justify
        prose-headings:font-bold prose-headings:text-gray-900 prose-headings:text-left
        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-justify
        prose-strong:text-gray-900
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
        prose-li:text-gray-700 prose-li:text-justify
        wrap-break-word
        [&_p:empty]:hidden [&_p:empty+br]:hidden
        [&_p]:mb-4 [&_p]:mt-0
        [&_br+br+br]:hidden
        ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanedContent }}
    />
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
