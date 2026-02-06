"use client";

import ScriptureContent from "./ScriptureContent";

interface TranscriptContentProps {
  content: string;
  accentColor?: "primary" | "amber";
}

/**
 * Client component wrapper for transcript/sermon content
 * with scripture reference tooltips.
 *
 * Scripture references are automatically detected by the global
 * ScriptureProvider and wrapped with interactive tooltips.
 */
export default function TranscriptContent({
  content,
  accentColor = "primary",
}: TranscriptContentProps) {
  const colorClasses =
    accentColor === "amber"
      ? "prose-a:text-amber-600 prose-blockquote:border-l-amber-500 prose-blockquote:bg-amber-500/5"
      : "";

  return <ScriptureContent content={content} className={colorClasses} />;
}
