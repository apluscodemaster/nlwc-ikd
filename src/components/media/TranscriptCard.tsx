"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, User, ChevronRight } from "lucide-react";
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

export default function TranscriptCard({
  transcript,
  searchQuery = "",
}: TranscriptCardProps) {
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
      label: "Sunday School",
    },
  };

  const style = typeStyles[transcript.type];
  const TypeIcon = style.icon;

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
      className="group"
    >
      <Link
        href={detailHref}
        className="block w-full overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div
            className={`${style.bg} ${style.text} px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {style.label}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {transcript.formattedDate}
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-2 wrap-break-word"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />

        {/* Speaker */}
        {transcript.speaker && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
            <User className="w-4 h-4" />
            {highlightedSpeaker ? (
              <span
                className="truncate"
                dangerouslySetInnerHTML={{ __html: highlightedSpeaker }}
              />
            ) : (
              <span className="truncate">{transcript.speaker}</span>
            )}
          </div>
        )}

        {/* Excerpt */}
        {highlightedExcerpt ? (
          <p
            className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-4 wrap-break-word"
            dangerouslySetInnerHTML={{ __html: highlightedExcerpt }}
          />
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-4 wrap-break-word">
            {excerptText}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground overflow-hidden">
            {transcript.categories.slice(0, 1).map((cat, index) => (
              <span
                key={index}
                className="bg-gray-100 px-2 py-1 rounded-md truncate max-w-[80px]"
              >
                {cat}
              </span>
            ))}
            {transcript.categories.length > 1 && (
              <span className="bg-gray-100 px-2 py-1 rounded-md">
                +{transcript.categories.length - 1}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-primary font-bold text-xs sm:text-sm group-hover:gap-2 transition-all whitespace-nowrap">
            Read
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
