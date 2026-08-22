"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, User, ChevronRight, Clock, Share2, Check } from "lucide-react";
import type { TranscriptPost } from "@/lib/wordpress";
import Link from "next/link";
import {
  highlightSearchInHtml,
  highlightSearchInText,
} from "@/utils/highlightSearch";

interface TranscriptCardProps {
  transcript: TranscriptPost;
  searchQuery?: string;
}

const MONTH_ABBR = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/**
 * Split the WordPress date into calendar-block parts.
 *
 * Deliberately parses the "YYYY-MM-DD" prefix as text rather than going through
 * `new Date()`: WordPress emits timestamps with no timezone suffix (e.g.
 * "2026-08-02T00:15:00"), which `Date` reads as LOCAL time. On a near-midnight
 * post that renders one day on the server and another in the browser — a
 * hydration mismatch. Returns null when the shape is unexpected, and the card
 * falls back to the pre-formatted date string.
 */
function getDateParts(
  date: string,
): { month: string; day: string; year: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return null;

  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  return {
    month: MONTH_ABBR[monthIndex],
    day: String(Number(match[3])),
    year: match[1],
  };
}

export default function TranscriptCard({
  transcript,
  searchQuery = "",
}: TranscriptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}/transcripts/${transcript.slug}`;
      const title = transcript.title.replace(/<[^>]*>/g, "");

      if (navigator.share) {
        navigator.share({ title, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [transcript],
  );
  const typeStyles = {
    "sunday-message": {
      bg: "bg-primary/10",
      text: "text-primary",
      icon: BookOpen,
      label: "Sunday Message",
    },
    "sunday-school": {
      bg: "bg-amber-500/10",
      text: "text-amber-600",
      icon: BookOpen,
      label: "Sunday School Manuals",
    },
  };

  const style = typeStyles[transcript.type] || typeStyles["sunday-message"];
  const TypeIcon = style.icon;
  const displayLabel = transcript.categories?.[0] || style.label;

  const dateParts = getDateParts(transcript.date);

  // Highlight title if there's a search query
  const highlightedTitle = searchQuery
    ? highlightSearchInHtml(transcript.title, searchQuery)
    : transcript.title;

  // Highlight excerpt if there's a search query
  const excerptText =
    transcript.excerpt || "Read the full transcript of this message...";
  const highlightedExcerpt = searchQuery
    ? highlightSearchInText(excerptText, searchQuery)
    : null;

  // Highlight speaker if there's a search query
  const highlightedSpeaker =
    searchQuery && transcript.speaker
      ? highlightSearchInText(transcript.speaker, searchQuery)
      : null;

  // Pass search query to detail page via URL param
  const detailHref = searchQuery
    ? `/transcripts/${transcript.slug}?q=${encodeURIComponent(searchQuery)}`
    : `/transcripts/${transcript.slug}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group h-full"
    >
      <Link
        href={detailHref}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white p-5 sm:p-6 ring-1 ring-gray-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:ring-primary/40 hover:shadow-xl hover:shadow-gray-900/5"
      >
        {/* Date block + heading */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${style.bg} ${style.text} leading-none`}
          >
            {dateParts ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {dateParts.month}
                </span>
                <span className="mt-1 text-xl font-black">{dateParts.day}</span>
                <span className="mt-1 text-[9px] font-semibold opacity-70">
                  {dateParts.year}
                </span>
              </>
            ) : (
              <span className="px-1 text-center text-[9px] font-bold leading-tight">
                {transcript.formattedDate}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <span
                className={`${style.bg} ${style.text} inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest`}
              >
                <TypeIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{displayLabel}</span>
              </span>

              <button
                onClick={handleShare}
                className="-mr-1 -mt-1 flex shrink-0 items-center rounded-full p-2 text-gray-400 transition-all hover:bg-primary/10 hover:text-primary"
                aria-label="Share this transcript"
                title="Share"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Title */}
            <h3
              className="line-clamp-3 text-base sm:text-lg font-bold leading-snug text-gray-900 group-hover:text-primary transition-colors wrap-break-word"
              dangerouslySetInnerHTML={{ __html: highlightedTitle }}
            />
          </div>
        </div>

        {/* Speaker · reading time */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground">
          {transcript.speaker && (
            <>
              <span className="flex min-w-0 items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                {highlightedSpeaker ? (
                  <span
                    className="truncate"
                    dangerouslySetInnerHTML={{ __html: highlightedSpeaker }}
                  />
                ) : (
                  <span className="truncate">{transcript.speaker}</span>
                )}
              </span>
              <span aria-hidden="true" className="text-gray-300">
                ·
              </span>
            </>
          )}
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <Clock className="h-3.5 w-3.5 text-primary/70" />
            {transcript.readingTime} min read
          </span>
        </div>

        {/* Excerpt — flex-1 keeps footers aligned across a row */}
        {highlightedExcerpt ? (
          <p
            className="mt-3 mb-5 line-clamp-3 flex-1 text-xs sm:text-sm leading-relaxed text-muted-foreground wrap-break-word"
            dangerouslySetInnerHTML={{ __html: highlightedExcerpt }}
          />
        ) : (
          <p className="mt-3 mb-5 line-clamp-3 flex-1 text-xs sm:text-sm leading-relaxed text-muted-foreground wrap-break-word">
            {excerptText}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
          <div className="flex min-w-0 items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
            {transcript.categories.slice(0, 1).map((cat, index) => (
              <span
                key={index}
                className="max-w-[80px] truncate rounded-md bg-gray-100 px-2 py-1"
              >
                {cat}
              </span>
            ))}
            {transcript.categories.length > 1 && (
              <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1">
                +{transcript.categories.length - 1}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs sm:text-sm font-bold text-primary transition-all group-hover:gap-2">
            Read
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
