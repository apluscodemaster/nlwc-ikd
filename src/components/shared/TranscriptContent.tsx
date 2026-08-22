"use client";

import ScriptureContent from "./ScriptureContent";
import { highlightSearchInHtml } from "@/utils/highlightSearch";
import { formatMemoryTrack } from "@/utils/formatMemoryTrack";

interface TranscriptContentProps {
  content: string;
  accentColor?: "primary" | "amber";
  searchQuery?: string;
  /**
   * Extra prose classes appended after the accent classes, for callers that
   * want a richer reading treatment than the shared default (see the Sunday
   * School manual page). Purely additive — omitting it renders exactly as
   * before, which is what the transcript, sermon, overlay and quiz callers do.
   */
  className?: string;
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
  className = "",
}: TranscriptContentProps) {
  const accentClasses =
    accentColor === "amber"
      ? "prose-a:text-amber-600 prose-blockquote:border-l-amber-500 prose-blockquote:bg-amber-500/5"
      : "";
  const colorClasses = className
    ? `${accentClasses} ${className}`
    : accentClasses;

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
