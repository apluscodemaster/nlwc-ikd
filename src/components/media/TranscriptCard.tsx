"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Calendar, User, ChevronRight } from "lucide-react";
import type { TranscriptPost } from "@/lib/wordpress";
import Link from "next/link";

interface TranscriptCardProps {
  transcript: TranscriptPost;
}

export default function TranscriptCard({ transcript }: TranscriptCardProps) {
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
        href={`/transcripts/${transcript.slug}`}
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
          dangerouslySetInnerHTML={{ __html: transcript.title }}
        />

        {/* Speaker */}
        {transcript.speaker && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
            <User className="w-4 h-4" />
            <span className="truncate">{transcript.speaker}</span>
          </div>
        )}

        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-4 wrap-break-word">
          {transcript.excerpt || "Read the full transcript of this message..."}
        </p>

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
