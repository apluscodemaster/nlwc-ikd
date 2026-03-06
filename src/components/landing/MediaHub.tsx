"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import Link from "next/link";
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
  Youtube,
  FileText,
  BookOpen,
  Calendar,
  User,
} from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useAudioSermons } from "@/hooks/useAudioSermons";
import { useTranscripts, useManuals } from "@/hooks/useWordPress";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { AudioSermon } from "@/lib/audioSermons";
import MobileFullPlayer from "@/components/media/MobileFullPlayer";

// =============================================================================
// Video Messages fetch
// =============================================================================
interface VideoMessage {
  date: string;
  youtubeUrl: string;
  title?: string;
  minister?: string;
  id: string;
}

async function fetchVideoMessages(): Promise<VideoMessage[]> {
  const response = await fetch("/api/video-messages");
  if (!response.ok) throw new Error("Failed to fetch video messages");
  const data = await response.json();
  return data.messages;
}

// =============================================================================
// Tabs config
// =============================================================================
const TABS = [
  { key: "audio", label: "Audio Messages", icon: Headphones, href: "/sermons" },
  {
    key: "video",
    label: "Video Messages",
    icon: Youtube,
    href: "/video-messages",
  },
  {
    key: "transcripts",
    label: "Transcripts",
    icon: FileText,
    href: "/transcripts",
  },
  {
    key: "manuals",
    label: "Sunday School Manuals",
    icon: BookOpen,
    href: "/manuals",
  },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// =============================================================================
// Animations
// =============================================================================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function formatTime(time: number): string {
  if (!time || isNaN(time)) return "0:00";
  const totalSeconds = Math.floor(time);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// =============================================================================
// Skeleton loaders
// =============================================================================
function CardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video rounded-2xl" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================
export default function MediaHub() {
  const [activeTab, setActiveTab] = useState<TabKey>("audio");

  // ---- Audio state ----
  const {
    sermons: audioSermons,
    isLoading: isAudioLoading,
    error: audioError,
    fetchSermonDetail,
  } = useAudioSermons({ page: 1, perPage: 3, order: "DESC" });

  const [activeSermon, setActiveSermon] = useState<AudioSermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showMobilePlayer, setShowMobilePlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ---- Video state ----
  const {
    data: videos = [],
    isLoading: isVideoLoading,
    error: videoError,
  } = useQuery({
    queryKey: ["video-messages"],
    queryFn: fetchVideoMessages,
    staleTime: 5 * 60 * 1000,
  });
  const [selectedVideo, setSelectedVideo] = useState<VideoMessage | null>(null);

  // ---- Transcripts ----
  const {
    data: transcriptsData,
    isLoading: isTranscriptsLoading,
    error: transcriptsError,
  } = useTranscripts(1, 3);

  // ---- Manuals ----
  const {
    data: manualsData,
    isLoading: isManualsLoading,
    error: manualsError,
  } = useManuals(1, 3);

  // ---- Audio player controls ----
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
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
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

  const SPEED_OPTIONS = useMemo(() => [1, 1.25, 1.5, 1.75, 2], []);
  const cycleSpeed = useCallback(() => {
    setPlaybackRate((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, [SPEED_OPTIONS]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const vis = Boolean(activeSermon);
    if (vis) {
      document.documentElement.style.setProperty("--scroll-bottom", "8.5rem");
    } else {
      document.documentElement.style.removeProperty("--scroll-bottom");
    }
    return () => {
      document.documentElement.style.removeProperty("--scroll-bottom");
    };
  }, [activeSermon]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      audioRef.current.currentTime = (x / rect.width) * duration;
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

  // ---- Active tab config ----
  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <section className="relative bg-white py-12 sm:py-32 overflow-hidden">
      {/* Hidden audio el */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
          className="text-center mb-8 sm:mb-12 space-y-4"
        >
          <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
            — SPIRITUAL NOURISHMENT
          </h4>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900">
            Catch Up on the <span className="text-primary">Word</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Catch up on the latest messages and series from our pulpit.
            Available in video and audio formats.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="flex gap-1 p-1.5 bg-gray-100 rounded-2xl overflow-x-auto max-w-full scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 sm:px-5 sm:py-3 cursor-pointer rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-white text-primary shadow-md"
                      : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden min-[420px]:inline">{tab.label}</span>
                  <span className="min-[420px]:hidden">
                    {tab.key === "audio"
                      ? "Audio"
                      : tab.key === "video"
                        ? "Video"
                        : tab.key === "transcripts"
                          ? "Transcripts"
                          : "Manuals"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View All link */}
        <div className="flex justify-end mb-6">
          <Link
            href={activeTabConfig.href}
            className="inline-flex items-center gap-2 text-primary font-bold text-sm group"
          >
            View All {activeTabConfig.label}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* ===== AUDIO TAB ===== */}
          {activeTab === "audio" && (
            <motion.div
              key="audio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {isAudioLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[1, 2, 3].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : audioError ? (
                <div className="text-center py-16 text-muted-foreground">
                  Failed to load audio messages.
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                >
                  {audioSermons.slice(0, 3).map((sermon) => {
                    const isActive = activeSermon?.id === sermon.id;
                    const isThisPlaying = isActive && isPlaying;
                    const isThisLoading =
                      isLoadingAudio && activeSermon?.id === sermon.id;

                    return (
                      <motion.div
                        key={sermon.id}
                        variants={cardVariants}
                        whileHover={{ y: -5, transition: { duration: 0.3 } }}
                        className="group cursor-pointer"
                      >
                        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-2xl transition-all duration-500">
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

                          {sermon.series && (
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-widest shadow-lg z-10">
                              <Headphones className="w-3 h-3" />
                              {sermon.series}
                            </div>
                          )}

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
                              className={`w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 ${
                                isActive
                                  ? "scale-100 ring-4 ring-primary/30"
                                  : "scale-90 group-hover:scale-100"
                              }`}
                            >
                              {isThisLoading ? (
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin" />
                              ) : isThisPlaying ? (
                                <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary" />
                              ) : (
                                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary ml-1" />
                              )}
                            </div>
                          </button>

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
                          <div className="space-y-1.5">
                            <p className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest">
                              {sermon.date}
                            </p>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
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
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ===== VIDEO TAB ===== */}
          {activeTab === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {isVideoLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[1, 2, 3].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : videoError ? (
                <div className="text-center py-16 text-muted-foreground">
                  Failed to load video messages.
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                >
                  {videos.slice(0, 3).map((video, index) => (
                    <motion.div
                      key={video.id}
                      variants={cardVariants}
                      whileHover={{ y: -5, transition: { duration: 0.3 } }}
                      className="group cursor-pointer flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="relative aspect-video overflow-hidden bg-gray-900">
                        <Image
                          src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                          alt={video.title || "Video thumbnail"}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300 shadow-xl">
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-1" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </div>
                              <span className="text-[10px] sm:text-xs font-bold text-gray-500">
                                {video.date}
                              </span>
                            </div>
                            {video.minister && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {video.minister}
                              </div>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {video.title}
                          </h3>
                        </div>
                        <div className="mt-3 sm:mt-5 pt-3 sm:pt-5 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                            Video Message
                          </span>
                          <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-red-600 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ===== TRANSCRIPTS TAB ===== */}
          {activeTab === "transcripts" && (
            <motion.div
              key="transcripts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {isTranscriptsLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[1, 2, 3].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : transcriptsError ? (
                <div className="text-center py-16 text-muted-foreground">
                  Failed to load transcripts.
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                >
                  {(transcriptsData?.data ?? [])
                    .slice(0, 3)
                    .map((transcript) => (
                      <motion.div
                        key={transcript.id}
                        variants={cardVariants}
                        whileHover={{ y: -5, transition: { duration: 0.3 } }}
                      >
                        <Link
                          href={`/transcripts/${transcript.slug}`}
                          className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                        >
                          <div className="relative aspect-video overflow-hidden bg-gray-100">
                            {transcript.thumbnail ? (
                              <Image
                                src={transcript.thumbnail}
                                alt={transcript.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full bg-linear-to-br from-primary/10 to-amber-500/5 flex items-center justify-center">
                                <FileText className="w-12 h-12 text-primary/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest shadow-lg">
                              <FileText className="w-3 h-3 inline mr-1" />
                              Transcript
                            </div>
                          </div>

                          <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                            <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest">
                              {transcript.formattedDate}
                            </p>
                            <h3 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                              {transcript.title}
                            </h3>
                            {transcript.speaker && (
                              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                {transcript.speaker}
                              </p>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ===== MANUALS TAB ===== */}
          {activeTab === "manuals" && (
            <motion.div
              key="manuals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {isManualsLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[1, 2, 3].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : manualsError ? (
                <div className="text-center py-16 text-muted-foreground">
                  Failed to load Sunday School manuals.
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                >
                  {(manualsData?.data ?? []).slice(0, 3).map((manual) => (
                    <motion.div
                      key={manual.id}
                      variants={cardVariants}
                      whileHover={{ y: -5, transition: { duration: 0.3 } }}
                    >
                      <Link
                        href={`/manuals/${manual.slug}`}
                        className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                      >
                        <div className="relative aspect-video overflow-hidden bg-gray-100">
                          {manual.thumbnail ? (
                            <Image
                              src={manual.thumbnail}
                              alt={manual.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-green-500/10 to-primary/5 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-green-600/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black text-green-700 uppercase tracking-widest shadow-lg">
                            <BookOpen className="w-3 h-3 inline mr-1" />
                            Manual
                          </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                          <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest">
                            {manual.formattedDate}
                          </p>
                          <h3 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {manual.title}
                          </h3>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== FLOATING MINI PLAYER (Audio) ===== */}
      <AnimatePresence>
        {activeSermon && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
          >
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

            <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2.5 pb-2 sm:pt-3 sm:pb-2.5">
              <div className="flex items-center gap-2.5 sm:gap-5">
                {/* Thumbnail */}
                <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden shrink-0 shadow-md">
                  {activeSermon.thumbnailUrl ? (
                    <Image
                      src={activeSermon.thumbnailUrl}
                      alt={activeSermon.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  )}
                </div>

                {/* Song Info — clickable on mobile */}
                <button
                  className="min-w-0 flex-1 text-left sm:pointer-events-none cursor-pointer sm:cursor-default"
                  onClick={() => setShowMobilePlayer(true)}
                  aria-label="Open full player"
                >
                  <h4 className="font-bold text-gray-900 text-xs sm:text-base truncate">
                    {activeSermon.title}
                  </h4>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">
                    {activeSermon.speaker}
                  </p>
                </button>

                {/* Time (desktop) */}
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
                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
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
                    onClick={cycleSpeed}
                    className="flex items-center justify-center px-2 py-1 sm:px-2.5 rounded-full bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary text-[10px] sm:text-xs font-bold transition-all min-w-[36px] sm:min-w-[44px]"
                    aria-label={`Playback speed ${playbackRate}x`}
                  >
                    {playbackRate}x
                  </button>

                  <button
                    onClick={closePlayer}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Close player"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen mobile player */}
      {activeSermon && (
        <MobileFullPlayer
          show={showMobilePlayer}
          onClose={() => setShowMobilePlayer(false)}
          onClosePlayer={closePlayer}
          title={activeSermon.title}
          speaker={activeSermon.speaker}
          series={activeSermon.series}
          thumbnailUrl={activeSermon.thumbnailUrl}
          downloadUrl={activeSermon.downloadUrl}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          isMuted={isMuted}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onToggleMute={toggleMute}
          onCycleSpeed={cycleSpeed}
          onProgressClick={handleProgressClick}
        />
      )}

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-0 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-none sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90 border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideo.title}
                className="w-full h-full border-none relative z-10"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
