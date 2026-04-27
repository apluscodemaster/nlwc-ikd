"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  Youtube,
  Calendar,
  Play,
  Search,
  Loader2,
  User,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tag,
  Share2,
} from "lucide-react";
import ResumePrompt from "@/components/media/ResumePrompt";
import {
  saveMediaProgress,
  getMediaProgress,
  clearMediaProgress,
  formatProgressTime,
  type MediaProgress,
} from "@/lib/mediaProgress";
import { loadYouTubeIframeAPI } from "@/lib/youtubePlayer";

interface VideoMessage {
  date: string;
  youtubeUrl: string;
  title?: string;
  minister?: string;
  serviceCategory?: string;
  id: string;
}

const VIDEOS_PER_PAGE = 12;

async function fetchVideoMessages(): Promise<VideoMessage[]> {
  const response = await fetch("/api/video-messages");
  if (!response.ok) throw new Error("Failed to fetch video messages");
  const data = await response.json();
  return data.messages;
}

// =============================================================================
// Progress bar indicator on video cards
// =============================================================================

function VideoProgressBar({ videoId }: { videoId: string }) {
  const [progress, setProgress] = useState<MediaProgress | null>(null);

  useEffect(() => {
    setProgress(getMediaProgress(videoId));
  }, [videoId]);

  if (!progress || progress.duration <= 0) return null;

  const percent = Math.min(
    (progress.currentTime / progress.duration) * 100,
    100,
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      <div className="h-1.5 bg-black/30">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="absolute right-2 bottom-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        {formatProgressTime(progress.currentTime)} /{" "}
        {formatProgressTime(progress.duration)}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function VideoMessagesContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinister, setSelectedMinister] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedVideo, setSelectedVideo] = useState<VideoMessage | null>(null);
  const [resumeStartTime, setResumeStartTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Resume prompt state
  const [resumePrompt, setResumePrompt] = useState<{
    video: VideoMessage;
    savedProgress: MediaProgress;
  } | null>(null);

  // YouTube player instance ref
  const ytPlayerRef = useRef<YT.Player | null>(null);
  const ytPlayerContainerRef = useRef<HTMLDivElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // TanStack Query integration
  const {
    data: videos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["video-messages"],
    queryFn: fetchVideoMessages,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter videos
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesSearch =
        v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.date.includes(searchQuery) ||
        v.minister?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.serviceCategory?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMinister =
        selectedMinister === "All" || v.minister === selectedMinister;

      const matchesCategory =
        selectedCategory === "All" || v.serviceCategory === selectedCategory;

      return matchesSearch && matchesMinister && matchesCategory;
    });
  }, [videos, searchQuery, selectedMinister, selectedCategory]);

  // Extract unique ministers for filter
  const ministers = useMemo(() => {
    return [
      "All",
      ...(Array.from(
        new Set(videos.map((v) => v.minister).filter(Boolean)),
      ) as string[]),
    ];
  }, [videos]);

  // Extract unique service categories for filter
  const serviceCategories = useMemo(() => {
    return [
      "All",
      ...(Array.from(
        new Set(videos.map((v) => v.serviceCategory).filter(Boolean)),
      ) as string[]),
    ];
  }, [videos]);

  // Pagination logic
  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE,
    currentPage * VIDEOS_PER_PAGE,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMinister, selectedCategory]);

  // ===========================================================================
  // YouTube IFrame Player API integration for progress tracking
  // ===========================================================================

  // Save current video progress from the YT player
  const saveCurrentProgress = useCallback(() => {
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
      // Player may have been destroyed — ignore
    }
  }, [selectedVideo]);

  // Start periodic progress saving when a video is playing
  const startProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      saveCurrentProgress();
    }, 5000);
  }, [saveCurrentProgress]);

  const stopProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Initialise the YouTube player when selectedVideo changes
  useEffect(() => {
    if (!selectedVideo || !ytPlayerContainerRef.current) return;

    let cancelled = false;

    async function initPlayer() {
      await loadYouTubeIframeAPI();
      if (cancelled || !ytPlayerContainerRef.current) return;

      // Destroy previous player if any
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
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
            start: Math.floor(resumeStartTime),
          },
          events: {
            onStateChange: (event: YT.OnStateChangeEvent) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                startProgressInterval();
              } else if (
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.BUFFERING
              ) {
                stopProgressInterval();
                saveCurrentProgress();
              } else if (event.data === window.YT.PlayerState.ENDED) {
                stopProgressInterval();
                // Clear progress when video finishes
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
      stopProgressInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVideo]);

  // Clean up player and interval on unmount
  useEffect(() => {
    return () => {
      stopProgressInterval();
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [stopProgressInterval]);

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentProgress();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveCurrentProgress]);

  // ===========================================================================
  // Video play handlers (with resume prompt)
  // ===========================================================================

  const handleVideoClick = useCallback((video: VideoMessage) => {
    const saved = getMediaProgress(video.id);
    if (saved && saved.currentTime > 0) {
      setResumePrompt({ video, savedProgress: saved });
    } else {
      setResumeStartTime(0);
      setSelectedVideo(video);
    }
  }, []);

  const handleResume = useCallback(() => {
    if (!resumePrompt) return;
    setResumeStartTime(resumePrompt.savedProgress.currentTime);
    setSelectedVideo(resumePrompt.video);
    setResumePrompt(null);
  }, [resumePrompt]);

  const handleStartOver = useCallback(() => {
    if (!resumePrompt) return;
    clearMediaProgress(resumePrompt.video.id);
    setResumeStartTime(0);
    setSelectedVideo(resumePrompt.video);
    setResumePrompt(null);
  }, [resumePrompt]);

  const handleDismissResume = useCallback(() => {
    setResumePrompt(null);
  }, []);

  const handleClosePlayer = useCallback(() => {
    // Save progress before closing
    saveCurrentProgress();
    stopProgressInterval();

    // Destroy player
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy();
      } catch {
        // ignore
      }
      ytPlayerRef.current = null;
    }

    setSelectedVideo(null);
    setResumeStartTime(0);
  }, [saveCurrentProgress, stopProgressInterval]);

  // ===========================================================================
  // Render
  // ===========================================================================

  if (isLoading) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Fetching latest video messages...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Youtube className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
        <p className="text-muted-foreground max-w-xs">
          {error instanceof Error
            ? error.message
            : "Unable to load video messages. Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* ===== RESUME PROMPT ===== */}
      <AnimatePresence>
        {resumePrompt && (
          <ResumePrompt
            isOpen={!!resumePrompt}
            mediaProgress={resumePrompt.savedProgress}
            mediaTitle={resumePrompt.video.title}
            mediaThumbnailUrl={`https://img.youtube.com/vi/${resumePrompt.video.id}/maxresdefault.jpg`}
            mediaType="video"
            onResume={handleResume}
            onStartOver={handleStartOver}
            onDismiss={handleDismissResume}
          />
        )}
      </AnimatePresence>

      {/* Controls: Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 max-w-5xl mx-auto">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by title, date, minister, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl border border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm"
          />
        </div>

        {/* Minister Filter */}
        <div className="relative w-full md:w-56">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            value={selectedMinister}
            onChange={(e) => setSelectedMinister(e.target.value)}
            className="w-full h-12 sm:h-14 pl-12 pr-10 rounded-2xl border border-gray-200 bg-white appearance-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm font-medium cursor-pointer"
          >
            {ministers.map((m) => (
              <option key={m} value={m}>
                {m === "All" ? "All Ministers" : m}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Service Category Filter */}
        {serviceCategories.length > 1 && (
          <div className="relative w-full md:w-56">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-12 sm:h-14 pl-12 pr-10 rounded-2xl border border-gray-200 bg-white appearance-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm font-medium cursor-pointer"
            >
              {serviceCategories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 min-h-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage + searchQuery + selectedMinister}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {paginatedVideos.map((video, index) => (
              <motion.div
                key={video.id + index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex flex-col bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                {/* Video Preview */}
                <div className="relative aspect-video overflow-hidden bg-gray-900">
                  <Image
                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                    alt={video.title || "Video thumbnail"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300 shadow-xl"
                    >
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </motion.div>
                  </div>

                  {/* Progress bar overlay */}
                  <VideoProgressBar videoId={video.id} />
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                          {video.date}
                        </span>
                      </div>
                      {video.minister && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                          <User className="w-3 h-3" />
                          {video.minister}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {video.title}
                    </h3>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-50 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                      {video.serviceCategory || "Video Message"}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Share Button */}
                      <button
                        type="button"
                        title="Share this video"
                        className="p-1 rounded-full hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Slugify the title for the URL
                          function slugify(text: string) {
                            return text
                              .toString()
                              .normalize("NFKD")
                              .replace(/[\u0300-\u036F]/g, "") // Remove accents
                              .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove non-alphanumeric
                              .trim()
                              .replace(/\s+/g, "-")
                              .replace(/-+/g, "-")
                              .toLowerCase();
                          }
                          const slug = slugify(video.title || "video-message");
                          // Optionally append ID for uniqueness if needed:
                          // const url = `${window.location.origin}/video-messages/${slug}-${video.id}`;
                          const url = `${window.location.origin}/video-messages/${slug}`;
                          const shareData = {
                            title: video.title || "Video Message",
                            text: video.title || "Video Message",
                            url,
                          };
                          if (navigator.share) {
                            navigator.share(shareData).catch(() => {
                              navigator.clipboard.writeText(url);
                              alert("Link copied to clipboard!");
                            });
                          } else {
                            navigator.clipboard.writeText(url);
                            alert("Link copied to clipboard!");
                          }
                        }}
                        aria-label="Share video"
                      >
                        <Share2 className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                      </button>
                      <Youtube className="w-5 h-5 text-gray-300 group-hover:text-red-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
          <p className="text-muted-foreground font-medium">
            No results found matching your criteria
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedMinister("All");
              setSelectedCategory("All");
            }}
            className="mt-4 text-primary font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-4 pt-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  // Show only current page, 1, last page, and 1 sibling for large total pages
                  const isFirst = pageNum === 1;
                  const isLast = pageNum === totalPages;
                  const isSibling = Math.abs(pageNum - currentPage) <= 1;

                  if (!isFirst && !isLast && !isSibling) {
                    // Show ellipsis if needed
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={pageNum} className="text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl font-bold transition-all shadow-sm text-sm sm:text-base ${
                        currentPage === pageNum
                          ? "bg-primary text-white scale-105 sm:scale-110 shadow-lg shadow-primary/20"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {filteredVideos.length}{" "}
            messages
          </p>
        </div>
      )}

      {/* ===== VIDEO PLAYER MODAL (YouTube IFrame API) ===== */}
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
              {/* Close Button */}
              <button
                onClick={handleClosePlayer}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90 border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* YouTube Player Container (managed by YT IFrame API) */}
              <div
                ref={ytPlayerContainerRef}
                className="w-full h-full relative z-10"
              />

              {/* Info Overlay - Hidden on Mobile */}
              <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-linear-to-t from-black/80 to-transparent pointer-events-none z-20">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                      Now Playing
                    </span>
                    <span className="text-white/60 text-sm font-medium">
                      {selectedVideo.date} • {selectedVideo.minister}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {selectedVideo.title}
                  </h2>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
