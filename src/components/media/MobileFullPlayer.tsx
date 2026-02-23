"use client";

import React from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  X,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Headphones,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function formatTime(time: number): string {
  if (!time || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export interface MobileFullPlayerProps {
  show: boolean;
  onClose: () => void;
  onClosePlayer: () => void;
  title: string;
  speaker?: string;
  series?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onToggleMute: () => void;
  onCycleSpeed: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Use "dark" for dark-themed pages, "light" for white/light pages */
  variant?: "dark" | "light";
}

export default function MobileFullPlayer({
  show,
  onClose,
  onClosePlayer,
  title,
  speaker,
  series,
  thumbnailUrl,
  downloadUrl,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  isMuted,
  onTogglePlay,
  onSeek,
  onToggleMute,
  onCycleSpeed,
  onProgressClick,
}: MobileFullPlayerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-60 bg-linear-to-b from-gray-900 via-gray-800 to-black flex flex-col sm:hidden"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Minimize player"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
              Now Playing
            </p>
            <button
              onClick={() => {
                onClose();
                onClosePlayer();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 transition-all"
              aria-label="Close player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center px-10 py-6">
            <div className="relative w-full max-w-[300px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-primary/30 to-amber-500/20 flex items-center justify-center">
                  <Headphones className="w-24 h-24 text-white/30" />
                </div>
              )}
              {/* Playing animation overlay */}
              {isPlaying && (
                <div className="absolute bottom-4 right-4 flex items-end gap-1 h-6">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      animate={{
                        height: ["30%", "100%", "50%", "80%", "30%"],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Song Info */}
          <div className="px-8 mb-4">
            <h3 className="text-white text-xl font-bold truncate">{title}</h3>
            <p className="text-white/50 text-sm mt-1 truncate">
              {speaker}
              {series && ` • ${series}`}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-8 mb-6">
            <div
              className="h-2 bg-white/10 rounded-full cursor-pointer group relative"
              onClick={onProgressClick}
            >
              <div
                className="h-full bg-linear-to-r from-primary to-amber-500 rounded-full relative transition-all duration-100"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[11px] text-white/40 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={() => onSeek(-15)}
              className="text-white/60 hover:text-white transition-colors p-2"
              aria-label="Rewind 15 seconds"
            >
              <SkipBack className="w-7 h-7" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-16 h-16 rounded-full bg-linear-to-r from-primary to-amber-500 flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>

            <button
              onClick={() => onSeek(15)}
              className="text-white/60 hover:text-white transition-colors p-2"
              aria-label="Forward 15 seconds"
            >
              <SkipForward className="w-7 h-7" />
            </button>
          </div>

          {/* Secondary Controls */}
          <div className="flex items-center justify-center gap-5 pb-10 px-8">
            <button
              onClick={onCycleSpeed}
              className="flex items-center justify-center px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm font-bold transition-all active:scale-95 min-w-[52px]"
              aria-label={`Playback speed ${playbackRate}x`}
            >
              {playbackRate}x
            </button>

            <button
              onClick={onToggleMute}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
                aria-label="Download"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
