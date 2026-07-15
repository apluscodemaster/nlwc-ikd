"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Pause, X, Headphones, ChevronUp } from "lucide-react";

interface GlobalAudioBarProps {
  title: string;
  speaker?: string;
  thumbnailUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onExpand: () => void;
  onClose: () => void;
}

/**
 * Persistent mini player (mobile only). Rendered by GlobalAudioProvider from the
 * root layout, so it survives client-side navigation. Tapping it opens the
 * full-screen MobileFullPlayer.
 */
export default function GlobalAudioBar({
  title,
  speaker,
  thumbnailUrl,
  isPlaying,
  currentTime,
  duration,
  onToggle,
  onExpand,
  onClose,
}: GlobalAudioBarProps) {
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 80 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-gray-900/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      {/* Progress line */}
      <div className="h-0.5 w-full bg-white/10">
        <div
          className="h-full bg-linear-to-r from-primary to-amber-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Tap target → expand */}
        <button
          onClick={onExpand}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Open full player"
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                sizes="44px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Headphones className="h-5 w-5 text-white/30" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{title}</p>
            <p className="truncate text-[11px] text-white/50">
              {speaker || "NLWC Ikorodu"}
            </p>
          </div>

          <ChevronUp className="h-4 w-4 shrink-0 text-white/30" />
        </button>

        <button
          onClick={onToggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-primary to-amber-500 text-white shadow-lg shadow-primary/25 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </button>

        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 active:scale-95"
          aria-label="Close player"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
