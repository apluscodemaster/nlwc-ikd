"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Download,
  Loader2,
  Headphones,
  User,
  Calendar,
  BookOpen,
  Clock,
  Music,
  Share2,
} from "lucide-react";
import type { AudioSermon } from "@/lib/audioSermons";
import { findTranscriptSlug, type TranscriptStub } from "@/utils/transcriptSlug";

interface SermonCardProps {
  sermon: AudioSermon;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLoadingDetail: boolean;
  onPlay: () => void;
  onPause: () => void;
  transcriptSlugs: TranscriptStub[];
  onTranscriptClick: (slug: string, title: string, speaker?: string) => void;
}

export default function SermonCard({
  sermon,
  index,
  isActive,
  isPlaying,
  isLoadingDetail,
  onPlay,
  onPause,
  transcriptSlugs,
  onTranscriptClick,
}: SermonCardProps) {
  const matchedSlug = useMemo(
    () => findTranscriptSlug(sermon.title, transcriptSlugs, sermon.id),
    [sermon.title, transcriptSlugs, sermon.id],
  );
  const transcriptHref = matchedSlug
    ? `/transcripts/${matchedSlug}`
    : "/transcripts";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300 ${
        isActive
          ? "ring-2 ring-primary shadow-2xl shadow-primary/15"
          : "ring-1 ring-gray-200/70 hover:ring-primary/40 hover:shadow-2xl hover:shadow-gray-900/10"
      }`}
    >
      {/* ===== Cover ===== */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {sermon.thumbnailUrl ? (
          <Image
            src={sermon.thumbnailUrl}
            alt={sermon.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/25 via-amber-100 to-white">
            <Headphones className="h-12 w-12 text-primary/40" />
          </div>
        )}

        {/* Scrim so overlaid text stays legible on any artwork */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/5" />

        {/* Brand wash while this message is the loaded one */}
        <div
          className={`absolute inset-0 bg-linear-to-t from-primary/55 to-transparent transition-opacity duration-500 ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Full-cover play/pause target — badges and text above it are
            pointer-events-none so clicks fall through to this button. */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoadingDetail}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={isPlaying ? "Pause" : "Play"}
        />

        {/* Now Playing */}
        {isPlaying && (
          <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/30 backdrop-blur-md">
            <div className="flex h-3 items-end gap-[2px]">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-white"
                  animate={{ height: ["40%", "100%", "60%", "80%", "40%"] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            Now Playing
          </div>
        )}

        {/* Duration */}
        {sermon.duration && (
          <div className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/15 backdrop-blur-md">
            <Clock className="h-3 w-3" />
            {sermon.duration}
          </div>
        )}

        {/* Floating play control */}
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 sm:bottom-5 sm:right-5">
          <div
            className={`flex h-13 w-13 items-center justify-center rounded-full shadow-xl transition-all duration-300 sm:h-14 sm:w-14 ${
              isActive
                ? "bg-primary text-white shadow-primary/40"
                : "bg-white/95 text-gray-900 backdrop-blur-md group-hover:scale-105 group-hover:bg-primary group-hover:text-white"
            }`}
          >
            {isLoadingDetail ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="ml-0.5 h-6 w-6" />
            )}
          </div>
        </div>

        {/* Title block, overlaid on the cover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 pr-[4.75rem] sm:p-5 sm:pr-[5.5rem]">
          {sermon.series && (
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25 backdrop-blur-md">
              <Music className="h-3 w-3" />
              {sermon.series}
            </span>
          )}

          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-white sm:text-base">
            {sermon.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/75 sm:text-xs">
            {sermon.speaker && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {sermon.speaker}
              </span>
            )}
            {sermon.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {sermon.date}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== Action bar ===== */}
      <div className="flex items-center gap-1 border-t border-gray-100 p-3 sm:px-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoadingDetail}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
            isActive
              ? "bg-primary text-white shadow-md shadow-primary/25"
              : "bg-gray-100 text-gray-800 hover:bg-primary hover:text-white"
          }`}
          id={`play-sermon-${sermon.id}`}
        >
          {isLoadingDetail ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <>
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="ml-0.5 h-4 w-4" />
              <span>Listen</span>
            </>
          )}
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          {/* Transcript — overlay for a matched transcript, else the index page */}
          {matchedSlug ? (
            <button
              onClick={() =>
                onTranscriptClick(matchedSlug, sermon.title, sermon.speaker)
              }
              className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-gray-500 transition-all hover:bg-primary/10 hover:text-primary sm:text-sm"
              title="Read Transcript"
              id={`transcript-sermon-${sermon.id}`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Transcript</span>
            </button>
          ) : (
            <Link
              href={transcriptHref}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-gray-500 transition-all hover:bg-primary/10 hover:text-primary sm:text-sm"
              title="View All Transcripts"
              id={`transcript-sermon-${sermon.id}`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Transcripts</span>
            </Link>
          )}

          <Link
            href={`/sermons/audio/${sermon.id}`}
            className="flex items-center rounded-full p-2 text-gray-400 transition-all hover:bg-primary/10 hover:text-primary"
            title="Shareable link"
            aria-label="Share this message"
          >
            <Share2 className="h-4 w-4" />
          </Link>

          {sermon.downloadUrl && (
            <a
              href={sermon.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center rounded-full p-2 text-gray-400 transition-all hover:bg-primary/10 hover:text-primary"
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
