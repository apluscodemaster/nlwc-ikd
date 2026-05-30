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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isActive
          ? "border-primary/40 shadow-xl shadow-primary/10 ring-1 ring-primary/20"
          : "bg-white border-gray-100 hover:border-primary/30 hover:shadow-lg"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {sermon.thumbnailUrl ? (
          <Image
            src={sermon.thumbnailUrl}
            alt={sermon.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 to-amber-100 flex items-center justify-center">
            <Headphones className="w-12 h-12 text-primary/40" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        {/* Play button on thumbnail */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoadingDetail}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isActive
                ? "bg-primary text-white scale-110"
                : "bg-white/90 text-gray-800 hover:bg-primary hover:text-white hover:scale-110"
            }`}
          >
            {isLoadingDetail ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </div>
        </button>

        {/* Duration badge */}
        {sermon.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {sermon.duration}
          </div>
        )}

        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-white text-xs font-semibold">
            <div className="flex items-end gap-0.5 h-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] bg-white rounded-full"
                  animate={{
                    height: ["40%", "100%", "60%", "80%", "40%"],
                  }}
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
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Series Tag */}
        {sermon.series && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-[11px] sm:text-xs font-semibold">
            <Music className="w-3 h-3" />
            {sermon.series}
          </div>
        )}

        {/* Title */}
        <h3
          className={`font-bold text-sm sm:text-base leading-snug line-clamp-2 transition-colors ${
            isActive ? "text-primary" : "text-gray-900 group-hover:text-primary"
          }`}
        >
          {sermon.title}
        </h3>

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {sermon.speaker && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-primary/60" />
              {sermon.speaker}
            </span>
          )}
          {sermon.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary/60" />
              {sermon.date}
            </span>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Play Button */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={isLoadingDetail}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              isActive
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-gray-100 text-gray-700 hover:bg-primary hover:text-white"
            }`}
            id={`play-sermon-${sermon.id}`}
          >
            {isLoadingDetail ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 ml-0.5" />
                <span>Listen</span>
              </>
            )}
          </button>

          {/* Transcript Link */}
          {matchedSlug ? (
            <button
              onClick={() =>
                onTranscriptClick(matchedSlug, sermon.title, sermon.speaker)
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-500 hover:text-primary hover:bg-primary/5 transition-all"
              title="Read Transcript"
              id={`transcript-sermon-${sermon.id}`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Transcript</span>
            </button>
          ) : (
            <Link
              href={transcriptHref}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-500 hover:text-primary hover:bg-primary/5 transition-all"
              title="View All Transcripts"
              id={`transcript-sermon-${sermon.id}`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Transcripts</span>
            </Link>
          )}

          {/* Share link */}
          <Link
            href={`/sermons/audio/${sermon.id}`}
            className="flex items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
            title="Shareable link"
            aria-label="Share this message"
          >
            <Share2 className="w-4 h-4" />
          </Link>

          {/* Download */}
          {sermon.downloadUrl && (
            <a
              href={sermon.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
