"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, User, ChevronRight, Clock, Share2, Check } from "lucide-react";
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
            {displayLabel}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {transcript.formattedDate}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {transcript.readingTime} min read
            </div>
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
              aria-label="Share this transcript"
              title="Share"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
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
