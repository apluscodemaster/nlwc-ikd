"use client";

import ScriptureContent from "./ScriptureContent";
import { highlightSearchInHtml } from "@/utils/highlightSearch";

interface TranscriptContentProps {
  content: string;
  accentColor?: "primary" | "amber";
  searchQuery?: string;
}

/**
 * Client component wrapper for transcript/sermon content
 * with scripture reference tooltips and optional search highlighting.
 *
 * Scripture references are automatically detected by the global
 * ScriptureProvider and wrapped with interactive tooltips.
 */
export default function TranscriptContent({
  content,
  accentColor = "primary",
  searchQuery = "",
}: TranscriptContentProps) {
  const colorClasses =
    accentColor === "amber"
      ? "prose-a:text-amber-600 prose-blockquote:border-l-amber-500 prose-blockquote:bg-amber-500/5"
      : "";

  // Apply search highlighting to the content if a query is provided
  const highlightedContent = searchQuery
    ? highlightSearchInHtml(content, searchQuery)
    : content;

  return (
    <ScriptureContent content={highlightedContent} className={colorClasses} />
  );
}
