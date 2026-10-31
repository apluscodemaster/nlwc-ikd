"use client";

import { useMemo } from "react";
import ScriptureContent from "./ScriptureContent";
import { useUrlSearchQuery } from "@/hooks/useUrlSearchQuery";
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
  searchQuery: searchQueryProp,
  className = "",
}: TranscriptContentProps) {
  // Detail pages don't pass a query: they highlight the page's own `?q=`,
  // read in the browser so the page itself stays cacheable.
  const urlQuery = useUrlSearchQuery();
  const searchQuery = searchQueryProp ?? urlQuery;
  const accentClasses =
    accentColor === "amber"
      ? "prose-a:text-amber-600 prose-blockquote:border-l-amber-500 prose-blockquote:bg-amber-500/5"
      : "";
  const colorClasses = className
    ? `${accentClasses} ${className}`
    : accentClasses;

  const formattedContent = useMemo(() => {
    // Apply search highlighting to the content if a query is provided
    const highlighted = searchQuery
      ? highlightSearchInHtml(content, searchQuery)
      : content;
    // Enhance "Memory Track" sections for an aesthetic UI layout
    return formatMemoryTrack(highlighted);
  }, [content, searchQuery]);

  // Keyed by the query: scripture tooltips are wired into the rendered HTML
  // once, so when highlighting swaps the HTML in after mount, remount to
  // re-wire them rather than leave the new text untagged.
  return (
    <ScriptureContent
      key={searchQuery}
      content={formattedContent}
      className={colorClasses}
    />
  );
}
