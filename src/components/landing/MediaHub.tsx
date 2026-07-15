"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import Link from "next/link";
import SectionLabel from "@/components/shared/SectionLabel";
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
  Clock,
} from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useAudioSermons } from "@/hooks/useAudioSermons";
import { useTranscripts, useManuals } from "@/hooks/useWordPress";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { AudioSermon } from "@/lib/audioSermons";
import { useGlobalAudio } from "@/components/providers/GlobalAudioProvider";
import ManualThumbnail from "@/components/media/ManualThumbnail";
import ResumePrompt from "@/components/media/ResumePrompt";
import {
  saveMediaProgress,
  getMediaProgress,
  clearMediaProgress,
  formatProgressTime,
  type MediaProgress,
} from "@/lib/mediaProgress";
import { loadYouTubeIframeAPI } from "@/lib/youtubePlayer";

// =============================================================================
// Video Messages fetch
// =============================================================================
interface VideoMessage {
  date: string;
  youtubeUrl: string;
  title?: string;
  minister?: string;
  serviceCategory?: string;
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

  // Audio playback is owned by GlobalAudioProvider (root layout) so it survives
  // navigating away from the homepage. This section only starts tracks; the
  // persistent bar and full-screen player are rendered by the provider. The
  // resume prompt below stays here since it's part of this section's flow.
  const audio = useGlobalAudio();
  const [loadingSermonId, setLoadingSermonId] = useState<number | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{
    sermon: AudioSermon;
    savedProgress: ReturnType<typeof getMediaProgress>;
  } | null>(null);

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
  const [videoResumeStartTime, setVideoResumeStartTime] = useState(0);
  const [videoResumePrompt, setVideoResumePrompt] = useState<{
    video: VideoMessage;
    savedProgress: MediaProgress;
  } | null>(null);

  // YouTube player refs
  const ytPlayerRef = useRef<YT.Player | null>(null);
  const ytPlayerContainerRef = useRef<HTMLDivElement | null>(null);
  const videoProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const startPlayback = useCallback(
    (sermon: AudioSermon, startTime = 0) => {
      if (!sermon.downloadUrl) return;
      audio.play(
        {
          id: sermon.id,
          title: sermon.title,
          speaker: sermon.speaker,
          series: sermon.series,
          thumbnailUrl: sermon.thumbnailUrl,
          src: sermon.downloadUrl,
          downloadUrl: sermon.downloadUrl,
          href: `/sermons/audio/${sermon.id}`,
        },
        startTime,
      );
    },
    [audio],
  );

  const handlePlay = useCallback(
    async (sermon: AudioSermon) => {
      // Same sermon → plain play/pause of the already-loaded element.
      if (audio.isCurrent(sermon.id)) {
        audio.toggle();
        return;
      }

      setLoadingSermonId(sermon.id);
      let sermonToPlay = sermon;
      if (!sermon.downloadUrl) {
        const detail = await fetchSermonDetail(sermon.id);
        if (detail && detail.downloadUrl) {
          sermonToPlay = detail;
        } else {
          setLoadingSermonId(null);
          return;
        }
      }

      // Check for saved progress (now the shared store, so a position saved
      // anywhere else on the site is offered here too).
      const saved = getMediaProgress(sermonToPlay.id);
      if (saved && saved.currentTime > 0) {
        setResumePrompt({ sermon: sermonToPlay, savedProgress: saved });
      } else {
        startPlayback(sermonToPlay, 0);
      }

      setLoadingSermonId(null);
    },
    [audio, fetchSermonDetail, startPlayback],
  );

  const handleResume = useCallback(() => {
    if (!resumePrompt?.savedProgress) return;
    startPlayback(resumePrompt.sermon, resumePrompt.savedProgress.currentTime);
    setResumePrompt(null);
  }, [resumePrompt, startPlayback]);

  const handleStartOver = useCallback(() => {
    if (!resumePrompt) return;
    clearMediaProgress(resumePrompt.sermon.id);
    startPlayback(resumePrompt.sermon, 0);
    setResumePrompt(null);
  }, [resumePrompt, startPlayback]);

  const handleDismissResume = useCallback(() => {
    setResumePrompt(null);
  }, []);

  // ---- Video player controls (YouTube IFrame API) ----
  const saveVideoProgress = useCallback(() => {
    if (!ytPlayerRef.current || !selectedVideo) return;
    try {
      const time = ytPlayerRef.current.getCurrentTime();
      const dur = ytPlayerRef.current.getDuration();
      if (time > 0 && dur > 0) {
        saveMediaProgress(
          selectedVideo.id,
          time,
          dur,
          selectedVideo.title || "Video Message",
          "video",
        );
      }
    } catch {
      // Player may have been destroyed
    }
  }, [selectedVideo]);

  const startVideoProgressInterval = useCallback(() => {
    if (videoProgressIntervalRef.current) {
      clearInterval(videoProgressIntervalRef.current);
    }
    videoProgressIntervalRef.current = setInterval(() => {
      saveVideoProgress();
    }, 5000);
  }, [saveVideoProgress]);

  const stopVideoProgressInterval = useCallback(() => {
    if (videoProgressIntervalRef.current) {
      clearInterval(videoProgressIntervalRef.current);
      videoProgressIntervalRef.current = null;
    }
  }, []);

  // Initialise YouTube player when selectedVideo changes
  useEffect(() => {
    if (!selectedVideo || !ytPlayerContainerRef.current) return;

    let cancelled = false;

    async function initPlayer() {
      await loadYouTubeIframeAPI();
      if (cancelled || !ytPlayerContainerRef.current) return;

      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch { /* ignore */ }
        ytPlayerRef.current = null;
      }

      ytPlayerRef.current = new window.YT.Player(
        ytPlayerContainerRef.current!,
        {
          videoId: selectedVideo!.id,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            start: Math.floor(videoResumeStartTime),
          },
          events: {
            onStateChange: (event: YT.OnStateChangeEvent) => {
              if (event.data === YT.PlayerState.PLAYING) {
                // The global player pauses itself when another <audio>/<video>
                // element starts, but YouTube runs in an iframe whose `play`
                // event never reaches this document — so hand off explicitly,
                // otherwise a sermon and this video would play over each other.
                audio.pause();
                startVideoProgressInterval();
              } else if (
                event.data === YT.PlayerState.PAUSED ||
                event.data === YT.PlayerState.BUFFERING
              ) {
                stopVideoProgressInterval();
                saveVideoProgress();
              } else if (event.data === YT.PlayerState.ENDED) {
                stopVideoProgressInterval();
                if (selectedVideo) {
                  clearMediaProgress(selectedVideo.id);
                }
              }
            },
          },
        },
      );
    }

    initPlayer();

    return () => {
      cancelled = true;
      stopVideoProgressInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo]);

  // Clean up YouTube player on unmount
  useEffect(() => {
    return () => {
      stopVideoProgressInterval();
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch { /* ignore */ }
        ytPlayerRef.current = null;
      }
    };
  }, [stopVideoProgressInterval]);

  // Save video progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => saveVideoProgress();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveVideoProgress]);

  const handleVideoPlay = useCallback((video: VideoMessage) => {
    const saved = getMediaProgress(video.id);
    if (saved && saved.currentTime > 0) {
      setVideoResumePrompt({ video, savedProgress: saved });
    } else {
      setVideoResumeStartTime(0);
      setSelectedVideo(video);
    }
  }, []);

  const handleVideoResume = useCallback(() => {
    if (!videoResumePrompt) return;
    setVideoResumeStartTime(videoResumePrompt.savedProgress.currentTime);
    setSelectedVideo(videoResumePrompt.video);
    setVideoResumePrompt(null);
  }, [videoResumePrompt]);

  const handleVideoStartOver = useCallback(() => {
    if (!videoResumePrompt) return;
    clearMediaProgress(videoResumePrompt.video.id);
    setVideoResumeStartTime(0);
    setSelectedVideo(videoResumePrompt.video);
    setVideoResumePrompt(null);
  }, [videoResumePrompt]);

  const handleVideoDismissResume = useCallback(() => {
    setVideoResumePrompt(null);
  }, []);

  const handleCloseVideoPlayer = useCallback(() => {
    saveVideoProgress();
    stopVideoProgressInterval();
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch { /* ignore */ }
      ytPlayerRef.current = null;
    }
    setSelectedVideo(null);
    setVideoResumeStartTime(0);
  }, [saveVideoProgress, stopVideoProgressInterval]);

  // ---- Active tab config ----
  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <section className="relative bg-white py-12 sm:py-32 overflow-hidden">
      {/* Resume Prompt */}
      {resumePrompt && resumePrompt.savedProgress && (
        <ResumePrompt
          isOpen={!!resumePrompt}
          mediaProgress={resumePrompt.savedProgress}
          mediaTitle={resumePrompt.sermon.title}
          mediaThumbnailUrl={resumePrompt.sermon.thumbnailUrl}
          mediaType="audio"
          onResume={handleResume}
          onStartOver={handleStartOver}
          onDismiss={handleDismissResume}
        />
      )}

      {/* The <audio> element and its progress saving live in
          GlobalAudioProvider now. */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
          className="text-center mb-8 sm:mb-12 space-y-4"
        >
          <SectionLabel>Spiritual Nourishment</SectionLabel>
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
                    const isActive = audio.isCurrent(sermon.id);
                    const isThisPlaying = isActive && audio.isPlaying;
                    const isThisLoading = loadingSermonId === sermon.id;

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
                                  width: `${audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0}%`,
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
                      onClick={() => handleVideoPlay(video)}
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
                            {video.serviceCategory || "Video Message"}
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
                            <div className="flex items-center gap-3">
                              <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest">
                                {transcript.formattedDate}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-primary/60 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                <span>{transcript.readingTime} min read</span>
                              </div>
                            </div>
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
                        {manual.thumbnail ? (
                          <div className="relative aspect-video overflow-hidden bg-gray-100">
                            <Image
                              src={manual.thumbnail}
                              alt={manual.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black text-green-700 uppercase tracking-widest shadow-lg">
                              <BookOpen className="w-3 h-3 inline mr-1" />
                              Manual
                            </div>
                          </div>
                        ) : (
                          <ManualThumbnail
                            title={manual.title}
                            className="group-hover:scale-105 transition-transform duration-700"
                          />
                        )}

                        <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest">
                              {manual.formattedDate}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-primary/60 uppercase tracking-widest">
                              <Clock className="w-3 h-3" />
                              <span>{manual.readingTime} min read</span>
                            </div>
                          </div>
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

      {/* The audio mini player and full-screen player now live in
          GlobalAudioProvider (root layout) so playback survives navigation.
          The video player below is unaffected. */}

      {/* Video Resume Prompt */}
      <AnimatePresence>
        {videoResumePrompt && (
          <ResumePrompt
            isOpen={!!videoResumePrompt}
            mediaProgress={videoResumePrompt.savedProgress}
            mediaTitle={videoResumePrompt.video.title}
            mediaThumbnailUrl={`https://img.youtube.com/vi/${videoResumePrompt.video.id}/maxresdefault.jpg`}
            mediaType="video"
            onResume={handleVideoResume}
            onStartOver={handleVideoStartOver}
            onDismiss={handleVideoDismissResume}
          />
        )}
      </AnimatePresence>

      {/* Video Player Modal (YouTube IFrame API) */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-0 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-none sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={handleCloseVideoPlayer}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90 border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <div
                ref={ytPlayerContainerRef}
                className="w-full h-full relative z-10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
