"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Loader2,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  User,
  Calendar,
  Music,
  ExternalLink,
  X,
} from "lucide-react";
import { useAudioSermons } from "@/hooks/useAudioSermons";
import type { AudioSermon } from "@/lib/audioSermons";

interface AudioSermonsListProps {
  perPage?: number;
}

export default function AudioSermonsList({
  perPage = 10,
}: AudioSermonsListProps) {
  const [page, setPage] = useState(1);
  const {
    sermons,
    isLoading,
    error,
    pagination,
    fetchPage,
    fetchSermonDetail,
  } = useAudioSermons({ page, perPage });
  const [activeSermon, setActiveSermon] = useState<AudioSermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle page changes
  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  // Handle playing a sermon
  const handlePlay = useCallback(
    async (sermon: AudioSermon) => {
      setIsLoadingDetail(true);

      // If the sermon doesn't have a download URL, fetch the detail
      let sermonToPlay = sermon;
      if (!sermon.downloadUrl) {
        const detail = await fetchSermonDetail(sermon.id);
        if (detail && detail.downloadUrl) {
          sermonToPlay = detail;
        }
      }

      setActiveSermon(sermonToPlay);
      setIsLoadingDetail(false);

      if (sermonToPlay.downloadUrl && audioRef.current) {
        audioRef.current.src = sermonToPlay.downloadUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    },
    [fetchSermonDetail],
  );

  // Audio controls
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + seconds,
      ),
    );
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      audioRef.current.currentTime = percentage * duration;
    },
    [duration],
  );

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setActiveSermon(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <div className="space-y-8">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center animate-pulse">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <p className="text-muted-foreground font-medium text-lg mt-6">
            Loading audio messages...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Headphones className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to load audio messages
          </h3>
          <p className="text-muted-foreground max-w-xs">{error}</p>
        </div>
      )}

      {/* Sermons List */}
      {!isLoading && !error && (
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {sermons.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Headphones className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No audio messages found
                </h3>
                <p className="text-muted-foreground">
                  Check back later for new content.
                </p>
              </div>
            ) : (
              sermons.map((sermon, index) => (
                <AudioSermonCard
                  key={sermon.id || index}
                  sermon={sermon}
                  isActive={activeSermon?.id === sermon.id}
                  isPlaying={activeSermon?.id === sermon.id && isPlaying}
                  isLoadingDetail={
                    isLoadingDetail && activeSermon?.id === sermon.id
                  }
                  onPlay={() => handlePlay(sermon)}
                  onPause={togglePlay}
                  index={index}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-6 pt-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {Array.from(
                { length: Math.min(pagination.totalPages, 5) },
                (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl font-bold transition-all shadow-sm text-sm sm:text-base ${
                        page === pageNum
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white scale-105 sm:scale-110 shadow-lg shadow-indigo-500/20"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Count */}
          <p className="text-center text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages} • ~{pagination.total} audio
            messages
          </p>
        </div>
      )}

      {/* Sticky Audio Player */}
      <AnimatePresence>
        {activeSermon && activeSermon.downloadUrl && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-xl border-t border-white/10 shadow-2xl"
          >
            {/* Progress Bar */}
            <div
              className="h-1.5 bg-white/10 cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-100 relative"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3 sm:gap-6">
                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-sm sm:text-base truncate">
                    {activeSermon.title}
                  </h4>
                  <p className="text-white/60 text-xs sm:text-sm truncate">
                    {activeSermon.speaker}
                    {activeSermon.series && ` • ${activeSermon.series}`}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Time */}
                  <span className="hidden sm:block text-white/50 text-xs font-mono min-w-[80px] text-right">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>

                  <button
                    onClick={() => seek(-15)}
                    className="text-white/70 hover:text-white transition-colors p-1"
                    aria-label="Back 15 seconds"
                  >
                    <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg shadow-indigo-500/30"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => seek(15)}
                    className="text-white/70 hover:text-white transition-colors p-1"
                    aria-label="Forward 15 seconds"
                  >
                    <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={toggleMute}
                    className="hidden sm:block text-white/70 hover:text-white transition-colors p-1"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  {/* Download Link */}
                  {activeSermon.downloadUrl && (
                    <a
                      href={activeSermon.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex text-white/70 hover:text-white transition-colors p-1"
                      aria-label="Download audio"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}

                  {/* Close */}
                  <button
                    onClick={closePlayer}
                    className="text-white/50 hover:text-white transition-colors p-1"
                    aria-label="Close player"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer when player is active */}
      {activeSermon && activeSermon.downloadUrl && (
        <div className="h-20 sm:h-24" />
      )}
    </div>
  );
}

// Individual Audio Sermon Card
function AudioSermonCard({
  sermon,
  isActive,
  isPlaying,
  isLoadingDetail,
  onPlay,
  onPause,
  index,
}: {
  sermon: AudioSermon;
  isActive: boolean;
  isPlaying: boolean;
  isLoadingDetail: boolean;
  onPlay: () => void;
  onPause: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isActive
          ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg shadow-indigo-100"
          : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md"
      }`}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-600 rounded-l-2xl" />
      )}

      <div className="flex items-center gap-3 sm:gap-5 p-4 sm:p-5">
        {/* Play Button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoadingDetail}
          className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isActive
              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-indigo-300"
              : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-500 group-hover:from-purple-100 group-hover:to-indigo-100 group-hover:text-indigo-600"
          }`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoadingDetail ? (
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-bold text-sm sm:text-base line-clamp-1 transition-colors ${
              isActive
                ? "text-indigo-900"
                : "text-gray-900 group-hover:text-indigo-700"
            }`}
          >
            {sermon.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {sermon.speaker && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                {sermon.speaker}
              </span>
            )}
            {sermon.date && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                {sermon.date}
              </span>
            )}
            {sermon.series && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-indigo-500">
                <Music className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {sermon.series}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <a
            href={sermon.listenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            title="Open on website"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Playing Animation */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-purple-500 to-indigo-500 rounded-full"
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
        )}
      </div>
    </motion.div>
  );
}
