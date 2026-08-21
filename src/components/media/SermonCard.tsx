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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={`group flex h-full flex-col rounded-2xl p-4 transition-all duration-300 sm:p-5 ${
        isActive
          ? "bg-primary/[0.04] ring-2 ring-primary shadow-lg shadow-primary/10"
          : "bg-white ring-1 ring-gray-200/70 hover:ring-primary/40 hover:shadow-lg hover:shadow-gray-900/5"
      }`}
    >
      {/* ===== Artwork + text ===== */}
      <div className="flex items-start gap-4">
        {/* Artwork — the whole square is the play/pause target */}
        <div
          className={`relative h-22 w-22 shrink-0 overflow-hidden rounded-xl bg-gray-100 transition-all duration-300 sm:h-24 sm:w-24 ${
            isActive ? "ring-2 ring-primary/60" : "ring-1 ring-gray-200/80"
          }`}
        >
          {sermon.thumbnailUrl ? (
            <Image
              src={sermon.thumbnailUrl}
              alt={sermon.title}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/25 to-amber-100">
              <Headphones className="h-7 w-7 text-primary/45" />
            </div>
          )}

          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={isLoadingDetail}
            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 ${
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors ${
                isActive ? "bg-primary text-white" : "bg-white/95 text-gray-900"
              }`}
            >
              {isLoadingDetail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" />
              )}
            </span>
          </button>

          {/* Duration */}
          {sermon.duration && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/65 py-0.5 text-[10px] font-medium text-white">
              <Clock className="h-2.5 w-2.5" />
              {sermon.duration}
            </div>
          )}
        </div>

        {/* Text column */}
        <div className="min-w-0 flex-1">
          {sermon.series && (
            <span className="mb-1.5 inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              <Music className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{sermon.series}</span>
            </span>
          )}

          <h3
            className={`line-clamp-2 text-[15px] font-bold leading-snug transition-colors sm:text-base ${
              isActive
                ? "text-primary"
                : "text-gray-900 group-hover:text-primary"
            }`}
          >
            {sermon.title}
          </h3>

          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {sermon.speaker && (
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span className="truncate">{sermon.speaker}</span>
              </span>
            )}
            {sermon.date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span className="truncate">{sermon.date}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== Action bar ===== */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoadingDetail}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all sm:text-sm ${
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

        {/* Now Playing */}
        {isPlaying && (
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-primary">
            <div className="flex h-3 items-end gap-[2px]">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-primary"
                  animate={{ height: ["40%", "100%", "60%", "80%", "40%"] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            {/* Label shows where the card is wide: 1-col mobile and xl 3-col */}
            <span className="inline truncate sm:hidden xl:inline">
              Now Playing
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {/* Transcript — overlay for a matched transcript, else the index page */}
          {matchedSlug ? (
            <button
              onClick={() =>
                onTranscriptClick(matchedSlug, sermon.title, sermon.speaker)
              }
              className="flex items-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium text-gray-500 transition-all hover:bg-primary/10 hover:text-primary"
              title="Read Transcript"
              id={`transcript-sermon-${sermon.id}`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="inline sm:hidden xl:inline">Transcript</span>
            </button>
          ) : (
            <Link
              href={transcriptHref}
              className="flex items-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium text-gray-500 transition-all hover:bg-primary/10 hover:text-primary"
              title="View All Transcripts"
              id={`transcript-sermon-${sermon.id}`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="inline sm:hidden xl:inline">Transcripts</span>
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
