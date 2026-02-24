"use client";

import React from "react";

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
  // Clean up excessive whitespace, empty paragraphs, and special chars from WP content
  const cleanedContent = content
    // Remove excessive &nbsp; sequences (more than 2 in a row)
    .replace(/(&nbsp;\s*){3,}/gi, "&nbsp;&nbsp;")
    // Remove empty paragraphs with only whitespace/nbsp
    .replace(/<p[^>]*>\s*(&nbsp;\s*)*\s*<\/p>/gi, "")
    // Collapse multiple <br> tags into at most 2
    .replace(/(<br\s*\/?\s*>\s*){3,}/gi, "<br /><br />")
    // Remove \u00a0 (non-breaking spaces) when they appear in sequences
    .replace(/(\u00a0\s*){3,}/g, " ")
    // Remove double+ blank lines in pre-formatted text
    .replace(/\n{3,}/g, "\n\n");

  return (
    <div
      data-scripture-content="true"
      className={`prose prose-sm sm:prose-base md:prose-lg prose-gray max-w-none
        prose-headings:font-bold prose-headings:text-gray-900
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
