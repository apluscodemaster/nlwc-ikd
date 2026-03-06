"use client";

import ScriptureContent from "./ScriptureContent";
import { highlightSearchInHtml } from "@/utils/highlightSearch";
import { formatMemoryTrack } from "@/utils/formatMemoryTrack";

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
      ? "prose-a:text-amber-600 prose-blockquote:border-l-amber-500 prose-blockquote:bg-amber-500/5 text-justify sm:text-left"
      : "";

  // Apply search highlighting to the content if a query is provided
  let formattedContent = searchQuery
    ? highlightSearchInHtml(content, searchQuery)
    : content;

  // Enhance "Memory Track" sections for an aesthetic UI layout
  formattedContent = formatMemoryTrack(formattedContent);

  return (
    <ScriptureContent content={formattedContent} className={colorClasses} />
  );
}
