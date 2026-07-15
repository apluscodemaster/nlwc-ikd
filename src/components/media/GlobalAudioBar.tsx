"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  X,
  Headphones,
  ChevronUp,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat2,
  Shuffle,
} from "lucide-react";

function formatTime(time: number): string {
  if (!time || isNaN(time)) return "0:00";
  const total = Math.floor(time);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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
  /** False when there's nowhere to expand/navigate to — hides the affordance. */
  expandable?: boolean;
  // Desktop transport (mobile gets these in the full-screen player instead).
  playbackRate: number;
  isMuted: boolean;
  repeatMode: "off" | "one";
  isShuffled: boolean;
  onSeekBy: (seconds: number) => void;
  onSeekTo: (seconds: number) => void;
  onCycleSpeed: () => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
}

/**
 * Persistent mini player. Rendered by GlobalAudioProvider from the root layout,
 * so it survives client-side navigation.
 *
 * Mobile keeps it deliberately minimal — tapping opens MobileFullPlayer, which
 * carries the full transport. Desktop has no such sheet, so the seek/speed/mute/
 * repeat/shuffle controls the old per-page sticky bars had live inline here.
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
  expandable = true,
  playbackRate,
  isMuted,
  repeatMode,
  isShuffled,
  onSeekBy,
  onSeekTo,
  onCycleSpeed,
  onToggleMute,
  onToggleRepeat,
  onToggleShuffle,
}: GlobalAudioBarProps) {
  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSeekTo(((e.clientX - rect.left) / rect.width) * duration);
  };

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      exit={{ y: 80 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-gray-900/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      {/* Progress line — scrubbable on desktop, indicator only on mobile */}
      <div
        onClick={handleScrub}
        className="h-1 w-full bg-white/10 sm:cursor-pointer"
        role="presentation"
      >
        <div
          className="h-full bg-linear-to-r from-primary to-amber-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Tap target → expand (mobile) / open the message (desktop) */}
        <button
          onClick={expandable ? onExpand : undefined}
          disabled={!expandable}
          className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
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

          {expandable && (
            <ChevronUp className="h-4 w-4 shrink-0 text-white/30 sm:hidden" />
          )}
        </button>

        {/* ── Desktop transport ── */}
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <button
            onClick={onToggleShuffle}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              isShuffled
                ? "bg-primary/20 text-primary"
                : "text-white/50 hover:text-white"
            }`}
            aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
          >
            <Shuffle className="h-4 w-4" />
          </button>

          <button
            onClick={() => onSeekBy(-15)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
            aria-label="Rewind 15 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </button>
        </div>

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

        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <button
            onClick={() => onSeekBy(15)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
            aria-label="Forward 15 seconds"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              repeatMode === "one"
                ? "bg-primary/20 text-primary"
                : "text-white/50 hover:text-white"
            }`}
            aria-label={repeatMode === "one" ? "Disable repeat" : "Repeat"}
          >
            <Repeat2 className="h-4 w-4" />
          </button>

          <button
            onClick={onCycleSpeed}
            className="flex h-8 min-w-11 items-center justify-center rounded-full px-2 text-xs font-bold text-white/60 transition-colors hover:text-white"
            aria-label={`Playback speed ${playbackRate}x`}
          >
            {playbackRate}x
          </button>

          <button
            onClick={onToggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <span className="px-2 text-[11px] tabular-nums text-white/40">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white active:scale-95"
          aria-label="Close player"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
