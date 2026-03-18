"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, FastForward, RotateCcw, Headphones, Play } from "lucide-react";
import { MediaProgress, formatProgressTime } from "@/lib/mediaProgress";
import Image from "next/image";

interface ResumePromptProps {
  isOpen: boolean;
  mediaProgress: MediaProgress | null;
  mediaTitle?: string;
  mediaThumbnailUrl?: string;
  mediaType?: "audio" | "video";
  onResume: () => void;
  onStartOver: () => void;
  onDismiss: () => void;
}

export default function ResumePrompt({
  isOpen,
  mediaProgress,
  mediaTitle,
  mediaThumbnailUrl,
  mediaType = "audio",
  onResume,
  onStartOver,
  onDismiss,
}: ResumePromptProps) {
  if (!isOpen || !mediaProgress) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-linear-to-r from-primary to-amber-500 p-6 text-white">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {mediaType === "video" ? (
                <Play className="w-5 h-5" />
              ) : (
                <Headphones className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
                Resume {mediaType === "video" ? "Watching" : "Listening"}
              </p>
              <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2">
                {mediaTitle || mediaProgress.title}
              </h3>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-white/70 mb-1.5">
              <span>
                {mediaType === "video" ? "Watched" : "Listened"}:{" "}
                {formatProgressTime(mediaProgress.currentTime)}
              </span>
              {mediaProgress.duration > 0 && (
                <span>Total: {formatProgressTime(mediaProgress.duration)}</span>
              )}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${mediaProgress.duration > 0 ? (mediaProgress.currentTime / mediaProgress.duration) * 100 : 0}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 space-y-3">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            <FastForward className="w-5 h-5" />
            Continue from {formatProgressTime(mediaProgress.currentTime)}
          </button>
          <button
            onClick={onStartOver}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" />
            {mediaType === "video" ? "Watch Again" : "Listen Again"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
