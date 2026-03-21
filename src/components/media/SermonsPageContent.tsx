"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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
  X,
  User,
  Calendar,
  BookOpen,
  Filter,
  ChevronDown,
  Clock,
  Music,
  Tag,
  SortAsc,
  SortDesc,
  RotateCcw,
  FastForward,
} from "lucide-react";
import { useAudioSermons, useFilterOptions } from "@/hooks/useAudioSermons";
import { useQuery } from "@tanstack/react-query";
import type { AudioSermon } from "@/lib/audioSermons";

// Transcript slug lookup
interface TranscriptStub {
  slug: string;
  title: string;
}

async function fetchTranscriptSlugs(): Promise<TranscriptStub[]> {
  const WP_API =
    process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikorodu.nlwc.church";
  const CATEGORY_ID = 20; // Sunday Message Transcripts

  try {
    const allTranscripts: TranscriptStub[] = [];
    let page = 1;
    let totalPages = 1;
    const maxPages = 10; // Safety cap

    while (page <= totalPages && page <= maxPages) {
      try {
        const url = `${WP_API}/wp-json/wp/v2/posts?categories=${CATEGORY_ID}&per_page=100&page=${page}&_fields=title,slug&orderby=date&order=desc`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(
            `[TranscriptMatch] WP API page ${page} failed: ${res.status}`,
          );
          break;
        }

        totalPages = parseInt(
          res.headers.get("X-WP-TotalPages") || "1",
          10,
        );

        const posts: { title: { rendered: string }; slug: string }[] =
          await res.json();
        allTranscripts.push(
          ...posts.map((p) => ({
            slug: p.slug,
            title: p.title.rendered,
          })),
        );
      } catch (pageError) {
        console.warn(
          `[TranscriptMatch] Error fetching page ${page}:`,
          pageError,
        );
        break;
      }
      page++;
    }

    console.log(
      `[TranscriptMatch] Fetched ${allTranscripts.length} transcript slugs across ${page - 1} page(s)`,
    );
    return allTranscripts;
  } catch (err) {
    console.error("[TranscriptMatch] Failed to fetch transcript slugs:", err);
    return [];
  }
}



function normalizeTitle(title: string): string {
  return (
    title
      .toLowerCase()
      // Decode common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&ndash;/g, "-")
      .replace(/&mdash;/g, "-")
      // Normalize unicode quotes/dashes
      .replace(/[\u2018\u2019\u0027]/g, "'")
      .replace(/[\u201C\u201D\u0022]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      // Remove all non-alphanumeric chars except spaces
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function findTranscriptSlug(
  sermonTitle: string,
  transcripts: TranscriptStub[],
): string | null {
  const normalizedSermon = normalizeTitle(sermonTitle);
  if (!normalizedSermon) return null;

  // 1. Exact match first
  for (const t of transcripts) {
    if (normalizeTitle(t.title) === normalizedSermon) {
      return t.slug;
    }
  }

  // 2. Substring match — only if the sermon title is long enough to avoid false positives
  if (normalizedSermon.length >= 10) {
    for (const t of transcripts) {
      const normalizedTranscript = normalizeTitle(t.title);
      if (
        normalizedSermon.includes(normalizedTranscript) ||
        normalizedTranscript.includes(normalizedSermon)
      ) {
        return t.slug;
      }
    }
  }

  // 3. Word-overlap scoring for fuzzy matching
  const sermonWords = normalizedSermon.split(" ").filter((w) => w.length > 2);
  if (sermonWords.length >= 2) {
    let bestMatch: { slug: string; score: number } | null = null;
    for (const t of transcripts) {
      const transcriptWords = normalizeTitle(t.title)
        .split(" ")
        .filter((w) => w.length > 2);
      if (transcriptWords.length === 0) continue;

      const matchingWords = sermonWords.filter((w) =>
        transcriptWords.includes(w),
      );
      const score =
        matchingWords.length /
        Math.max(sermonWords.length, transcriptWords.length);
      // Require at least 60% word overlap
      if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { slug: t.slug, score };
      }
    }
    if (bestMatch) return bestMatch.slug;
  }

  return null;
}

// =============================================================================
// Playback Progress Persistence (localStorage)
// =============================================================================

interface SavedProgress {
  sermonId: number;
  currentTime: number;
  duration: number;
  title: string;
  timestamp: number; // Date.now() when saved
}

const PROGRESS_KEY_PREFIX = "nlwc-sermon-progress-";
const PROGRESS_INDEX_KEY = "nlwc-sermon-progress-index";
const PROGRESS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PROGRESS_MIN_SECONDS = 15; // Don't save if less than 15s played
const PROGRESS_NEAR_END_SECONDS = 30; // Consider finished if within 30s of end

function saveProgress(sermon: AudioSermon, time: number, dur: number) {
  if (typeof window === "undefined") return;
  // Don't save if barely started or near the end
  if (time < PROGRESS_MIN_SECONDS) return;
  if (dur > 0 && dur - time < PROGRESS_NEAR_END_SECONDS) {
    clearProgress(sermon.id);
    return;
  }

  const data: SavedProgress = {
    sermonId: sermon.id,
    currentTime: time,
    duration: dur,
    title: sermon.title,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(
      `${PROGRESS_KEY_PREFIX}${sermon.id}`,
      JSON.stringify(data),
    );
    // Also maintain an index of saved IDs for cleanup
    const indexStr = localStorage.getItem(PROGRESS_INDEX_KEY);
    const index: number[] = indexStr ? JSON.parse(indexStr) : [];
    if (!index.includes(sermon.id)) {
      index.push(sermon.id);
      localStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(index));
    }
  } catch {
    // Storage full or not available — silently ignore
  }
}

function getProgress(sermonId: number): SavedProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const str = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${sermonId}`);
    if (!str) return null;
    const data: SavedProgress = JSON.parse(str);
    // Check age
    if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) {
      clearProgress(sermonId);
      return null;
    }
    // Don't offer resume for very short progress
    if (data.currentTime < PROGRESS_MIN_SECONDS) return null;
    return data;
  } catch {
    return null;
  }
}

function clearProgress(sermonId: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${sermonId}`);
    const indexStr = localStorage.getItem(PROGRESS_INDEX_KEY);
    if (indexStr) {
      const index: number[] = JSON.parse(indexStr);
      const newIndex = index.filter((id) => id !== sermonId);
      localStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(newIndex));
    }
  } catch {
    // Silently ignore
  }
}

function cleanupOldProgress() {
  if (typeof window === "undefined") return;
  try {
    const indexStr = localStorage.getItem(PROGRESS_INDEX_KEY);
    if (!indexStr) return;
    const index: number[] = JSON.parse(indexStr);
    for (const id of index) {
      const str = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${id}`);
      if (str) {
        const data: SavedProgress = JSON.parse(str);
        if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) {
          clearProgress(id);
        }
      } else {
        clearProgress(id);
      }
    }
  } catch {
    // Silently ignore
  }
}

function formatProgressTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// =============================================================================
// Main Component
// =============================================================================

export default function SermonsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialise filter state from URL query params
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("q") || "",
  );
  const [selectedSeries, setSelectedSeries] = useState<number | undefined>(
    searchParams.get("series") ? Number(searchParams.get("series")) : undefined,
  );
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | undefined>(
    searchParams.get("speaker")
      ? Number(searchParams.get("speaker"))
      : undefined,
  );
  const [selectedTopic, setSelectedTopic] = useState<number | undefined>(
    searchParams.get("topic") ? Number(searchParams.get("topic")) : undefined,
  );
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
  );
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">(
    (searchParams.get("sort") as "DESC" | "ASC") || "DESC",
  );
  const [page, setPage] = useState(
    searchParams.get("page") ? Number(searchParams.get("page")) : 1,
  );
  const [showFilters, setShowFilters] = useState(() => {
    // Auto-open filters panel if any filter is active from the URL
    return !!(
      searchParams.get("speaker") ||
      searchParams.get("series") ||
      searchParams.get("topic") ||
      searchParams.get("year")
    );
  });

  // Audio player state
  const [activeSermon, setActiveSermon] = useState<AudioSermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showMobilePlayer, setShowMobilePlayer] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Resume playback state
  const [resumePrompt, setResumePrompt] = useState<{
    sermon: AudioSermon;
    savedProgress: SavedProgress;
  } | null>(null);
  const progressSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Cleanup old progress on mount
  useEffect(() => {
    cleanupOldProgress();
  }, []);

  // Save progress periodically while playing
  useEffect(() => {
    if (isPlaying && activeSermon) {
      // Save every 5 seconds
      progressSaveIntervalRef.current = setInterval(() => {
        if (audioRef.current && activeSermon) {
          saveProgress(
            activeSermon,
            audioRef.current.currentTime,
            audioRef.current.duration || 0,
          );
        }
      }, 5000);
    } else {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
        progressSaveIntervalRef.current = null;
      }
    }

    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
    };
  }, [isPlaying, activeSermon]);

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        audioRef.current &&
        activeSermon &&
        audioRef.current.currentTime > 0
      ) {
        saveProgress(
          activeSermon,
          audioRef.current.currentTime,
          audioRef.current.duration || 0,
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeSermon]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data
  const {
    sermons,
    isLoading,
    error,
    pagination,
    fetchPage,
    fetchSermonDetail,
  } = useAudioSermons({
    page,
    perPage: 12,
    search: debouncedSearch || undefined,
    seriesId: selectedSeries,
    speakerId: selectedSpeaker,
    topicId: selectedTopic,
    year: selectedYear,
    order: sortOrder,
  });

  const {
    series,
    speakers,
    topics,
    isLoading: filtersLoading,
  } = useFilterOptions();

  // Fetch transcript slugs for matching
  const { data: transcriptSlugs = [] } = useQuery({
    queryKey: ["transcript-slugs"],
    queryFn: fetchTranscriptSlugs,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Page changes
  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSeries, selectedSpeaker, selectedTopic, selectedYear, sortOrder]);

  // ========================================================================
  // Sync filter state → URL query params (shareable links)
  // ========================================================================
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedSpeaker) params.set("speaker", String(selectedSpeaker));
    if (selectedSeries) params.set("series", String(selectedSeries));
    if (selectedTopic) params.set("topic", String(selectedTopic));
    if (selectedYear) params.set("year", String(selectedYear));
    if (sortOrder !== "DESC") params.set("sort", sortOrder);
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    const newUrl = qs ? `/sermons?${qs}` : "/sermons";

    // Only update if the URL actually changed
    const currentQs = window.location.search.replace(/^\?/, "");
    if (qs !== currentQs) {
      router.replace(newUrl, { scroll: false });
    }
  }, [
    debouncedSearch,
    selectedSpeaker,
    selectedSeries,
    selectedTopic,
    selectedYear,
    sortOrder,
    page,
    router,
  ]);

  // Active filter count
  const activeFilterCount = [
    selectedSeries,
    selectedSpeaker,
    selectedTopic,
    selectedYear,
  ].filter(Boolean).length;

  // Clear filters
  const clearAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedSeries(undefined);
    setSelectedSpeaker(undefined);
    setSelectedTopic(undefined);
    setSelectedYear(undefined);
    setSortOrder("DESC");
    setPage(1);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2007 },
    (_, i) => currentYear - i,
  );

  // ==========================================================================
  // Audio player controls
  // ==========================================================================

  // Starts playback from a specific time (0 = start, or resumed position)
  const startPlayback = useCallback(
    (sermon: AudioSermon, startTime: number = 0) => {
      setActiveSermon(sermon);
      if (sermon.downloadUrl && audioRef.current) {
        audioRef.current.src = sermon.downloadUrl;
        audioRef.current.currentTime = startTime;
        audioRef.current.play();
        setIsPlaying(true);
      }
    },
    [],
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

  const handlePlay = useCallback(
    async (sermon: AudioSermon) => {
      // If same sermon is already active, just toggle play/pause
      if (activeSermon?.id === sermon.id && audioRef.current?.src) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
        return;
      }

      setIsLoadingDetail(true);
      let sermonToPlay = sermon;
      if (!sermon.downloadUrl) {
        const detail = await fetchSermonDetail(sermon.id);
        if (detail && detail.downloadUrl) {
          sermonToPlay = detail;
        }
      }
      setIsLoadingDetail(false);

      // Check for saved progress
      const saved = getProgress(sermonToPlay.id);
      if (saved && saved.currentTime >= PROGRESS_MIN_SECONDS) {
        // Show resume prompt
        setResumePrompt({ sermon: sermonToPlay, savedProgress: saved });
      } else {
        // No saved progress — start from beginning
        startPlayback(sermonToPlay, 0);
      }
    },
    [fetchSermonDetail, activeSermon, isPlaying, startPlayback],
  );

  const handleResume = useCallback(() => {
    if (!resumePrompt) return;
    startPlayback(resumePrompt.sermon, resumePrompt.savedProgress.currentTime);
    setResumePrompt(null);
  }, [resumePrompt, startPlayback]);

  const handleStartOver = useCallback(() => {
    if (!resumePrompt) return;
    clearProgress(resumePrompt.sermon.id);
    startPlayback(resumePrompt.sermon, 0);
    setResumePrompt(null);
  }, [resumePrompt, startPlayback]);

  const handleDismissResume = useCallback(() => {
    setResumePrompt(null);
  }, []);

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

  // Playback speed
  const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];
  const cycleSpeed = useCallback(() => {
    setPlaybackRate((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const isPlayerVisible = Boolean(activeSermon && activeSermon.downloadUrl);
    if (isPlayerVisible) {
      document.documentElement.style.setProperty("--scroll-bottom", "8.5rem");
    } else {
      document.documentElement.style.removeProperty("--scroll-bottom");
    }
    return () => {
      document.documentElement.style.removeProperty("--scroll-bottom");
    };
  }, [activeSermon]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const totalSeconds = Math.floor(time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const closePlayer = useCallback(() => {
    // Save progress before closing
    if (audioRef.current && activeSermon && audioRef.current.currentTime > 0) {
      saveProgress(
        activeSermon,
        audioRef.current.currentTime,
        audioRef.current.duration || 0,
      );
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setActiveSermon(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [activeSermon]);

  // Handle sermon finished — clear saved progress
  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    if (activeSermon) {
      clearProgress(activeSermon.id);
    }
  }, [activeSermon]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hidden Audio */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleAudioEnded}
        onPause={() => {
          // Save progress when paused
          if (audioRef.current && activeSermon) {
            saveProgress(
              activeSermon,
              audioRef.current.currentTime,
              audioRef.current.duration || 0,
            );
          }
        }}
        preload="none"
      />

      {/* ===== RESUME PLAYBACK PROMPT ===== */}
      <AnimatePresence>
        {resumePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleDismissResume}
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
                  onClick={handleDismissResume}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
                      Resume Listening
                    </p>
                    <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2">
                      {resumePrompt.sermon.title}
                    </h3>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-white/70 mb-1.5">
                    <span>
                      Listened:{" "}
                      {formatProgressTime(
                        resumePrompt.savedProgress.currentTime,
                      )}
                    </span>
                    {resumePrompt.savedProgress.duration > 0 && (
                      <span>
                        Total:{" "}
                        {formatProgressTime(
                          resumePrompt.savedProgress.duration,
                        )}
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${resumePrompt.savedProgress.duration > 0 ? (resumePrompt.savedProgress.currentTime / resumePrompt.savedProgress.duration) * 100 : 0}%`,
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
                  onClick={handleResume}
                  className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                  id="resume-playback"
                >
                  <FastForward className="w-5 h-5" />
                  Continue from{" "}
                  {formatProgressTime(resumePrompt.savedProgress.currentTime)}
                </button>
                <button
                  onClick={handleStartOver}
                  className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
                  id="start-over"
                >
                  <RotateCcw className="w-5 h-5" />
                  Start Over
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SEARCH & FILTERS BAR ===== */}
      <div className="space-y-4">
        {/* Search + Filter Toggle Row */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages by title or speaker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm placeholder:text-gray-400 text-sm sm:text-base"
              id="sermon-search"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative h-12 sm:h-14 px-4 sm:px-5 rounded-xl sm:rounded-2xl border font-semibold text-sm transition-all flex items-center gap-2 shrink-0 ${
              showFilters || activeFilterCount > 0
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
            }`}
            id="filter-toggle"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder((o) => (o === "DESC" ? "ASC" : "DESC"))}
            className="h-12 sm:h-14 px-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary transition-all flex items-center gap-2 shrink-0"
            title={sortOrder === "DESC" ? "Newest first" : "Oldest first"}
            id="sort-toggle"
          >
            {sortOrder === "DESC" ? (
              <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
            <span className="hidden sm:inline text-sm font-semibold">
              {sortOrder === "DESC" ? "Newest" : "Oldest"}
            </span>
          </button>
        </div>

        {/* Expandable Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
                {/* Speaker Filter */}
                <FilterDropdown
                  icon={<User className="w-4 h-4" />}
                  label="Speaker"
                  value={selectedSpeaker}
                  options={speakers.map((s) => ({
                    value: s.id,
                    label: s.name,
                    count: s.messageCount,
                  }))}
                  onChange={(v) => setSelectedSpeaker(v || undefined)}
                  isLoading={filtersLoading}
                  id="filter-speaker"
                />

                {/* Series/Category Filter */}
                <FilterDropdown
                  icon={<Music className="w-4 h-4" />}
                  label="Category"
                  value={selectedSeries}
                  options={series
                    .filter((s) => s.id !== 1) // Exclude demo
                    .map((s) => ({
                      value: s.id,
                      label: s.title,
                      count: s.messageCount,
                    }))}
                  onChange={(v) => setSelectedSeries(v || undefined)}
                  isLoading={filtersLoading}
                  id="filter-category"
                />

                {/* Topic Filter */}
                <FilterDropdown
                  icon={<Tag className="w-4 h-4" />}
                  label="Topic"
                  value={selectedTopic}
                  options={topics.map((t) => ({
                    value: t.id,
                    label: t.name,
                    count: t.messageCount,
                  }))}
                  onChange={(v) => setSelectedTopic(v || undefined)}
                  isLoading={filtersLoading}
                  id="filter-topic"
                />

                {/* Year Filter */}
                <FilterDropdown
                  icon={<Calendar className="w-4 h-4" />}
                  label="Year"
                  value={selectedYear}
                  options={years.map((y) => ({
                    value: y,
                    label: y.toString(),
                    count: 0, // We don't have counts for years easily available
                  }))}
                  onChange={(v) => setSelectedYear(v || undefined)}
                  isLoading={filtersLoading}
                  id="filter-year"
                  hideCount
                />

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-primary font-semibold hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Filtered by:
            </span>
            {selectedSpeaker && (
              <FilterTag
                label={
                  speakers.find((s) => s.id === selectedSpeaker)?.name ||
                  "Speaker"
                }
                onRemove={() => setSelectedSpeaker(undefined)}
              />
            )}
            {selectedSeries && (
              <FilterTag
                label={
                  series.find((s) => s.id === selectedSeries)?.title ||
                  "Category"
                }
                onRemove={() => setSelectedSeries(undefined)}
              />
            )}
            {selectedTopic && (
              <FilterTag
                label={
                  topics.find((t) => t.id === selectedTopic)?.name || "Topic"
                }
                onRemove={() => setSelectedTopic(undefined)}
              />
            )}
            {selectedYear && (
              <FilterTag
                label={selectedYear.toString()}
                onRemove={() => setSelectedYear(undefined)}
              />
            )}
          </div>
        )}
      </div>

      {/* ===== LOADING STATE ===== */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-linear-to-tr from-primary to-amber-500 flex items-center justify-center animate-pulse">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <Loader2 className="w-6 h-6 text-primary animate-spin absolute -bottom-1 -right-1" />
          </div>
          <p className="text-muted-foreground font-medium text-lg mt-6">
            Loading messages...
          </p>
        </div>
      )}

      {/* ===== ERROR STATE ===== */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Headphones className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to load messages
          </h3>
          <p className="text-muted-foreground max-w-xs">{error}</p>
        </div>
      )}

      {/* ===== SERMON CARDS GRID ===== */}
      {!isLoading && !error && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${debouncedSearch}-${selectedSeries}-${selectedSpeaker}-${selectedTopic}-${sortOrder}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {sermons.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Headphones className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No messages found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {debouncedSearch || activeFilterCount > 0
                    ? "Try adjusting your search or filters."
                    : "Check back later for new content."}
                </p>
                {(debouncedSearch || activeFilterCount > 0) && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-3 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {sermons.map((sermon, index) => (
                  <SermonCard
                    key={sermon.id}
                    sermon={sermon}
                    index={index}
                    isActive={activeSermon?.id === sermon.id}
                    isPlaying={activeSermon?.id === sermon.id && isPlaying}
                    isLoadingDetail={
                      isLoadingDetail && activeSermon?.id === sermon.id
                    }
                    onPlay={() => handlePlay(sermon)}
                    onPause={togglePlay}
                    transcriptSlugs={transcriptSlugs}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ===== PAGINATION ===== */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-4 pt-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous Page"
              id="pagination-prev"
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
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next Page"
              id="pagination-next"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages} •{" "}
            {pagination.total.toLocaleString()} messages
          </p>
        </div>
      )}

      {/* ===== STICKY AUDIO PLAYER ===== */}
      <AnimatePresence>
        {activeSermon && activeSermon.downloadUrl && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-xl border-t border-white/10 shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Progress Bar */}
            <div
              className="h-1.5 bg-white/10 cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-linear-to-r from-primary to-amber-500 transition-all duration-100 relative"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-2 sm:pt-3 sm:pb-3">
              <div className="flex items-center gap-3 sm:gap-6">
                {/* Thumbnail */}
                {activeSermon.thumbnailUrl && (
                  <div className="hidden sm:block w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={activeSermon.thumbnailUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Song Info — clickable on mobile to open full player */}
                <button
                  className="flex-1 min-w-0 text-left sm:pointer-events-none cursor-pointer sm:cursor-default"
                  onClick={() => setShowMobilePlayer(true)}
                  aria-label="Open full player"
                >
                  <h4 className="text-white font-semibold text-sm sm:text-base truncate">
                    {activeSermon.title}
                  </h4>
                  <p className="text-white/60 text-xs sm:text-sm truncate">
                    {activeSermon.speaker}
                    {activeSermon.series && ` • ${activeSermon.series}`}
                  </p>
                </button>

                {/* Controls */}
                <div className="flex items-center gap-2 sm:gap-4">
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
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-r from-primary to-amber-500 flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg shadow-primary/30"
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

                  {/* Speed Control */}
                  <button
                    onClick={cycleSpeed}
                    className="flex items-center justify-center px-2.5 py-1 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white text-xs font-bold transition-all min-w-[44px]"
                    aria-label={`Playback speed ${playbackRate}x`}
                    title="Change playback speed"
                  >
                    {playbackRate}x
                  </button>

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

      {/* ===== FULL-SCREEN MOBILE PLAYER (Spotify-like) ===== */}
      <AnimatePresence>
        {showMobilePlayer && activeSermon && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-60 bg-linear-to-b from-gray-900 via-gray-800 to-black flex flex-col sm:hidden"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <button
                onClick={() => setShowMobilePlayer(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Minimize player"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
                Now Playing
              </p>
              <button
                onClick={() => {
                  setShowMobilePlayer(false);
                  closePlayer();
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 transition-all"
                aria-label="Close player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center px-10 py-6">
              <div className="relative w-full max-w-[300px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                {activeSermon.thumbnailUrl ? (
                  <Image
                    src={activeSermon.thumbnailUrl}
                    alt={activeSermon.title}
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-primary/30 to-amber-500/20 flex items-center justify-center">
                    <Headphones className="w-24 h-24 text-white/30" />
                  </div>
                )}
                {/* Playing animation overlay */}
                {isPlaying && (
                  <div className="absolute bottom-4 right-4 flex items-end gap-1 h-6">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        animate={{
                          height: ["30%", "100%", "50%", "80%", "30%"],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Song Info */}
            <div className="px-8 mb-4">
              <h3 className="text-white text-xl font-bold truncate">
                {activeSermon.title}
              </h3>
              <p className="text-white/50 text-sm mt-1 truncate">
                {activeSermon.speaker}
                {activeSermon.series && ` • ${activeSermon.series}`}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="px-8 mb-6">
              <div
                className="h-2 bg-white/10 rounded-full cursor-pointer group relative"
                onClick={handleProgressClick}
              >
                <div
                  className="h-full bg-linear-to-r from-primary to-amber-500 rounded-full relative transition-all duration-100"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-white/40 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => seek(-15)}
                className="text-white/60 hover:text-white transition-colors p-2"
                aria-label="Rewind 15 seconds"
              >
                <SkipBack className="w-7 h-7" />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-linear-to-r from-primary to-amber-500 flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>

              <button
                onClick={() => seek(15)}
                className="text-white/60 hover:text-white transition-colors p-2"
                aria-label="Forward 15 seconds"
              >
                <SkipForward className="w-7 h-7" />
              </button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-center gap-5 pb-[calc(1rem+env(safe-area-inset-bottom))] px-8">
              <button
                onClick={cycleSpeed}
                className="flex items-center justify-center px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm font-bold transition-all active:scale-95 min-w-[52px]"
                aria-label={`Playback speed ${playbackRate}x`}
              >
                {playbackRate}x
              </button>

              <button
                onClick={toggleMute}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {activeSermon.downloadUrl && (
                <a
                  href={activeSermon.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
                  aria-label="Download"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      {activeSermon && activeSermon.downloadUrl && (
        <div className="h-20 sm:h-24" />
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function FilterDropdown({
  icon,
  label,
  value,
  options,
  onChange,
  isLoading,
  id,
  hideCount,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  options: { value: number; label: string; count: number }[];
  onChange: (value: number | undefined) => void;
  isLoading: boolean;
  id: string;
  hideCount?: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <select
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
        disabled={isLoading}
        className="w-full h-11 pl-10 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 appearance-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
        id={id}
      >
        <option value="">All {label}s</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} {!hideCount && opt.count > 0 ? `(${opt.count})` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// =============================================================================
// Sermon Card Component
// =============================================================================

function SermonCard({
  sermon,
  index,
  isActive,
  isPlaying,
  isLoadingDetail,
  onPlay,
  onPause,
  transcriptSlugs,
}: {
  sermon: AudioSermon;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLoadingDetail: boolean;
  onPlay: () => void;
  onPause: () => void;
  transcriptSlugs: TranscriptStub[];
}) {
  const matchedSlug = useMemo(
    () => findTranscriptSlug(sermon.title, transcriptSlugs),
    [sermon.title, transcriptSlugs],
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

          {/* Transcript Link — links to matched transcript or /transcripts */}
          <Link
            href={transcriptHref}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-500 hover:text-primary hover:bg-primary/5 transition-all"
            title={matchedSlug ? "Read Transcript" : "View All Transcripts"}
            id={`transcript-sermon-${sermon.id}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">
              {matchedSlug ? "Transcript" : "Transcripts"}
            </span>
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

// =============================================================================
// Helpers
// =============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
