"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, ChevronRight, Clock, Share2, Check } from "lucide-react";
import type { SundaySchoolManual } from "@/lib/wordpress";
import Link from "next/link";
import Image from "next/image";
import ManualThumbnail from "./ManualThumbnail";
import {
  highlightSearchInHtml,
  highlightSearchInText,
} from "@/utils/highlightSearch";

interface ManualCardProps {
  manual: SundaySchoolManual;
  searchQuery?: string;
}

export default function ManualCard({
  manual,
  searchQuery = "",
}: ManualCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const url = `${window.location.origin}/manuals/${manual.slug}`;
      const title = manual.title.replace(/<[^>]*>/g, "");

      if (navigator.share) {
        navigator.share({ title, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [manual],
  );
  // Highlight title if there's a search query
  const highlightedTitle = searchQuery
    ? highlightSearchInHtml(manual.title, searchQuery)
    : manual.title;

  // Highlight excerpt if there's a search query
  const excerptText =
    manual.excerpt || "Access the Sunday School manual for this lesson...";
  const highlightedExcerpt = searchQuery
    ? highlightSearchInText(excerptText, searchQuery)
    : null;

  // Pass search query to detail page via URL param
  const detailHref = searchQuery
    ? `/manuals/${manual.slug}?q=${encodeURIComponent(searchQuery)}`
    : `/manuals/${manual.slug}`;

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
        className="block w-full overflow-hidden bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-amber-500/20 transition-all duration-300"
      >
        {/* Thumbnail or Placeholder */}
        {manual.thumbnail ? (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={manual.thumbnail}
              alt={manual.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : (
          <ManualThumbnail title={manual.title} />
        )}

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Sunday School Manuals
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                {manual.formattedDate}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {manual.readingTime} min read
              </div>
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2 mb-3 leading-tight wrap-break-word"
            dangerouslySetInnerHTML={{ __html: highlightedTitle }}
          />

          {/* Excerpt */}
          {highlightedExcerpt ? (
            <p
              className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 wrap-break-word"
              dangerouslySetInnerHTML={{ __html: highlightedExcerpt }}
            />
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 wrap-break-word">
              {excerptText}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
              aria-label="Share this manual"
              title="Share"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-1 text-amber-600 font-bold text-xs sm:text-sm group-hover:gap-2 transition-all">
              Read
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
