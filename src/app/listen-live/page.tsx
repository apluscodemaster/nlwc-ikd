"use client";

import React, { useState, useRef, useCallback } from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import AudioLivePlayer from "@/components/live/AudioLivePlayer";
import ServiceCountdown from "@/components/live/ServiceCountdown";
import Image from "next/image";
import {
  ArrowRight,
  Headset,
  Calendar,
  Share2,
  Headphones,
  Play,
  Pause,
  X,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAudioSermons } from "@/hooks/useAudioSermons";
import { Skeleton } from "@/components/ui/skeleton";
import type { AudioSermon } from "@/lib/audioSermons";

function formatTime(time: number): string {
  if (!time || isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ListenLivePage() {
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
    <main>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />

      <PageHeader
        title="Listen Live"
        subtitle="Join our audio broadcast and immerse yourself in the Word. Perfect for slow connections or listening on the go."
        backgroundImage="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer className="pb-10">
        <AudioLivePlayer />
      </SectionContainer>

      <SectionContainer className="bg-gray-50 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
                — AUDIO EXPERIENCE
              </h4>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                Listen Anywhere, <br className="hidden sm:block" />
                <span className="text-primary">Anytime</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Can&apos;t watch the video? Our audio stream is optimized for
                all mobile devices and low-bandwidth environments, ensuring you
                never miss a moment of the service.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <Headset className="w-5 h-5" />,
                  title: "Crystal Clear",
                  desc: "High-quality audio streaming",
                },
                {
                  icon: <Calendar className="w-5 h-5" />,
                  title: "Weekly Schedule",
                  desc: "Sundays & Mid-week services",
                },
                {
                  icon: <Share2 className="w-5 h-5" />,
                  title: "Share Stream",
                  desc: "Invite others to listen along",
                },
                {
                  icon: <Calendar className="w-5 h-5" />,
                  title: "Reminders",
                  desc: "Get notified before we start",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-5 rounded-3xl bg-white border border-gray-100 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-[40px] transform rotate-3 scale-105" />
            <div className="relative bg-white p-8 sm:p-12 rounded-[40px] shadow-xl border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  Next Service In:
                </h3>
              </div>
              <ServiceCountdown />
            </div>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — RECENT AUDIO
            </h4>
            <h2 className="text-3xl font-bold text-gray-900">Audio Archives</h2>
          </div>
          <Link
            href="/sermons"
            className="inline-flex items-center gap-2 text-primary font-bold group"
          >
            View Full Archive
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

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
          <div className="text-center py-16 text-muted-foreground">
            Failed to load recent audio messages.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {sermons.slice(0, 3).map((sermon) => {
              const isActive = activeSermon?.id === sermon.id;
              const isThisPlaying = isActive && isPlaying;
              const isThisLoading =
                isLoadingAudio && activeSermon?.id === sermon.id;

              return (
                <motion.div
                  key={sermon.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-3xl overflow-hidden mb-4 shadow-md group-hover:shadow-2xl transition-all duration-500">
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

                    {/* Series badge */}
                    {sermon.series && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-widest shadow-lg z-10">
                        <Headphones className="w-3 h-3" />
                        {sermon.series}
                      </div>
                    )}

                    {/* Play Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePlay(sermon);
                      }}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                      aria-label={
                        isThisPlaying
                          ? `Pause ${sermon.title}`
                          : `Play ${sermon.title}`
                      }
                    >
                      <div
                        className={`w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 ${
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

                    {/* Progress on card */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-10">
                        <div
                          className="h-full bg-primary transition-[width] duration-200"
                          style={{
                            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <Link href="/sermons">
                    <div className="space-y-2">
                      <p className="text-xs font-black text-primary uppercase tracking-widest">
                        {sermon.date}
                      </p>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {sermon.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                        {sermon.speaker}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionContainer>

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
            {/* Progress Bar */}
            <div
              className="h-1.5 bg-gray-100 cursor-pointer group/progress"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-primary relative transition-[width] duration-200"
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
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

                {/* Time Display */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-mono shrink-0">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    onClick={() => seek(-15)}
                    className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    aria-label="Rewind 15 seconds"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

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

                  <button
                    onClick={() => seek(15)}
                    className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    aria-label="Forward 15 seconds"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

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
    </main>
  );
}
