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
  return (
    <div
      data-scripture-content="true"
      className={`prose prose-sm sm:prose-base md:prose-lg prose-gray max-w-none
        prose-headings:font-bold prose-headings:text-gray-900
        prose-p:text-gray-700 prose-p:leading-relaxed
        prose-strong:text-gray-900
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
        prose-li:text-gray-700
        wrap-break-word whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
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
