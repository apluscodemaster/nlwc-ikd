"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookMarked,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { SundaySchoolManual } from "@/lib/wordpress";

interface FeaturedManualProps {
  manual: SundaySchoolManual;
}

/**
 * "This Week's Lesson" hero — gives the most-recent manual a large, engaging
 * treatment (mirrors FeaturedDevotional on the devotionals page). Surfaces the
 * parsed theme and lesson so the newest study reads as a curated lesson, not
 * one more grid card.
 */
export default function FeaturedManual({ manual }: FeaturedManualProps) {
  const plainTitle = manual.title.replace(/<[^>]*>/g, "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-14"
    >
      <Link
        href={`/manuals/${manual.slug}`}
        className="group block relative overflow-hidden rounded-[32px] border border-amber-500/20 bg-white shadow-2xl shadow-amber-500/5"
      >
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-500" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors duration-500" />

        <div className="relative flex flex-col md:flex-row items-stretch">
          {/* Visual side */}
          <div className="md:w-2/5 relative min-h-[220px] md:min-h-[340px] overflow-hidden bg-linear-to-br from-amber-600 via-orange-500 to-yellow-500">
            {manual.thumbnail ? (
              <Image
                src={manual.thumbnail}
                alt={plainTitle}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookMarked className="w-24 h-24 text-white/20" />
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent md:bg-linear-to-r" />

            <div className="absolute bottom-6 left-6 md:top-8 md:left-8">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                This Week&apos;s Lesson
              </span>
            </div>
          </div>

          {/* Content side */}
          <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
            {manual.theme && (
              <span className="inline-flex items-center gap-1.5 self-start px-3 py-1 mb-4 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
                <BookMarked className="w-3.5 h-3.5" />
                {manual.theme}
              </span>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-amber-600 font-semibold">
              <span className="inline-flex items-center gap-2 text-sm md:text-base">
                <Calendar className="w-4 h-4" />
                {manual.formattedDate}
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-amber-500" />
                {manual.readingTime} min read
              </span>
            </div>

            <h2
              className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-amber-600 transition-colors duration-300 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: manual.title }}
            />

            {manual.lesson && (
              <p className="text-sm font-semibold text-amber-700/90 mb-3">
                Lesson: {manual.lesson}
              </p>
            )}

            <p className="text-gray-600 text-base md:text-lg mb-8 line-clamp-2 max-w-xl">
              {manual.excerpt ||
                "Dive into this week's Sunday School lesson and grow in the Word."}
            </p>

            <span className="inline-flex items-center gap-2 self-start h-13 px-8 rounded-full bg-amber-500 text-white font-bold text-base md:text-lg shadow-xl shadow-amber-500/20 group-hover:shadow-amber-500/30 group-hover:scale-[1.02] active:scale-95 transition-all">
              Read Now
              <ArrowRight className="w-5 h-5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
