"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Headphones, Play, ArrowLeft, Layers } from "lucide-react";
import type { AudioSermon } from "@/lib/audioSermons";

interface NextPartSuggestionProps {
  show: boolean;
  onClose: () => void;
  /** Part number of the message that just finished. */
  currentPart: number | null;
  previous: AudioSermon | null;
  next: AudioSermon | null;
}

function PartRow({
  sermon,
  label,
  primary,
}: {
  sermon: AudioSermon;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={`/sermons/audio/${sermon.id}`}
      className={`group flex items-center gap-3 rounded-2xl border p-3 transition-all ${
        primary
          ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
          : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100"
      }`}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-200">
        {sermon.thumbnailUrl ? (
          <Image
            src={sermon.thumbnailUrl}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-amber-500/20">
            <Headphones className="h-5 w-5 text-primary/60" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-gray-900">
          {sermon.title}
        </p>
        {sermon.speaker && (
          <p className="truncate text-xs text-gray-500">{sermon.speaker}</p>
        )}
      </div>

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
          primary ? "bg-primary text-white" : "bg-white text-gray-500"
        }`}
      >
        {primary ? (
          <Play className="ml-0.5 h-4 w-4" />
        ) : (
          <ArrowLeft className="h-4 w-4" />
        )}
      </div>
    </Link>
  );
}

/**
 * Shown after a multi-part message finishes, offering the adjacent part.
 * Rendered only when `parseSermonPart()` matched the current title AND a
 * sibling part exists — messages without parts never see this.
 */
export default function NextPartSuggestion({
  show,
  onClose,
  currentPart,
  previous,
  next,
}: NextPartSuggestionProps) {
  if (!previous && !next) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="relative bg-linear-to-r from-primary to-amber-500 p-6 text-white">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                    Continue the series
                  </p>
                  <h3 className="text-sm font-bold sm:text-base">
                    {currentPart !== null
                      ? `You just finished Part ${currentPart}`
                      : "More parts available"}
                  </h3>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-2.5 p-5">
              {next && <PartRow sermon={next} label="Up next" primary />}
              {previous && (
                <PartRow sermon={previous} label="Previous part" />
              )}

              <button
                onClick={onClose}
                className="mt-1 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
