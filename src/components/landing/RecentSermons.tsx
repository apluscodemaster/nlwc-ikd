"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  ArrowRight,
  Headphones,
  X,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useAudioSermons } from "@/hooks/useAudioSermons";
import { Skeleton } from "@/components/ui/skeleton";
import type { AudioSermon } from "@/lib/audioSermons";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function formatTime(time: number): string {
  if (!time || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function RecentSermons() {
  const { sermons, isLoading, error, fetchSermonDetail } = useAudioSermons({
    page: 1,
    perPage: 3,
    order: "DESC",
  });

  // Audio player state
  const [activeSermon, setActiveSermon] = useState<AudioSermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = useCallback(
    async (sermon: AudioSermon) => {
      // If same sermon, toggle play/pause
      if (activeSermon?.id === sermon.id && audioRef.current?.src) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
        return;
      }

      setIsLoadingAudio(true);
      let sermonToPlay = sermon;

      // Fetch detail to get download URL if not available
      if (!sermon.downloadUrl) {
        const detail = await fetchSermonDetail(sermon.id);
        if (detail && detail.downloadUrl) {
          sermonToPlay = detail;
        } else {
          setIsLoadingAudio(false);
          return;
        }
      }

      setActiveSermon(sermonToPlay);
      if (audioRef.current && sermonToPlay.downloadUrl) {
        audioRef.current.src = sermonToPlay.downloadUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setIsPlaying(true);
      }
      setIsLoadingAudio(false);
    },
    [activeSermon, isPlaying, fetchSermonDetail],
  );

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
    <section className="relative bg-white py-12 sm:py-32 overflow-hidden">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
        >
          <div className="space-y-4 max-w-2xl">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — RECENT MESSAGES
            </h4>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Spiritual <span className="text-primary">Nourishment</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Catch up on the latest messages and series from our pulpit.
              Available in video and audio formats.
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="rounded-full px-8 text-primary hover:text-primary hover:bg-primary/5"
          >
            <Link href="/sermons">
              View All Messages <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video rounded-3xl" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-muted-foreground">
            Failed to load recent sermons.
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8"
          >
            {sermons.slice(0, 3).map((sermon) => {
              const isActive = activeSermon?.id === sermon.id;
              const isThisPlaying = isActive && isPlaying;
              const isThisLoading = isActive && isLoadingAudio;

              return (
                <motion.div
                  key={sermon.id}
                  variants={cardVariants}
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 shadow-md group-hover:shadow-2xl transition-all duration-500">
                    {sermon.thumbnailUrl ? (
                      <Image
                        src={sermon.thumbnailUrl}
                        alt={sermon.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Headphones className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Play Button - triggers audio playback */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePlay(sermon);
                      }}
                      className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
                      aria-label={
                        isThisPlaying
                          ? `Pause ${sermon.title}`
                          : `Play ${sermon.title}`
                      }
                    >
                      <div
                        className={`w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transform transition-transform duration-300 ${
                          isActive
                            ? "scale-100 ring-4 ring-primary/30"
                            : "scale-90 group-hover:scale-100"
                        }`}
                      >
                        {isThisLoading ? (
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        ) : isThisPlaying ? (
                          <Pause className="w-6 h-6 text-primary fill-primary" />
                        ) : (
                          <Play className="w-6 h-6 text-primary fill-primary ml-1" />
                        )}
                      </div>
                    </button>

                    {sermon.series && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary flex items-center gap-2 z-10">
                        <Headphones className="w-3 h-3" />
                        {sermon.series}
                      </div>
                    )}

                    {/* Active indicator / mini progress on card */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-10">
                        <motion.div
                          className="h-full bg-primary"
                          style={{
                            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <Link href="/sermons">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-primary uppercase tracking-wider">
                        {sermon.date}
                      </p>
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {sermon.title}
                      </h3>
                      <p className="text-muted-foreground font-medium">
                        {sermon.speaker}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ===== FLOATING MINI PLAYER ===== */}
      <AnimatePresence>
        {activeSermon && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
          >
            {/* Progress Bar (clickable) */}
            <div
              className="h-1.5 bg-gray-100 cursor-pointer group/progress"
              onClick={handleProgressClick}
            >
              <motion.div
                className="h-full bg-primary relative"
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </motion.div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3 sm:gap-5">
                {/* Thumbnail */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 shadow-md">
                  {activeSermon.thumbnailUrl ? (
                    <Image
                      src={activeSermon.thumbnailUrl}
                      alt={activeSermon.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Headphones className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                    {activeSermon.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {activeSermon.speaker}
                  </p>
                </div>

                {/* Time Display (hidden on very small screens) */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono shrink-0">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* Skip Back */}
                  <button
                    onClick={() => seek(-15)}
                    className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    aria-label="Rewind 15 seconds"
                    title="Rewind 15s"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
                    )}
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={() => seek(15)}
                    className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    aria-label="Forward 15 seconds"
                    title="Forward 15s"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  {/* Mute */}
                  <button
                    onClick={toggleMute}
                    className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  {/* Close */}
                  <button
                    onClick={closePlayer}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Close player"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
