"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import TranscriptOverlay from "./TranscriptOverlay";
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
  Share2,
  Repeat2,
  Shuffle,
} from "lucide-react";
import { useAudioSermons, useFilterOptions } from "@/hooks/useAudioSermons";
import { useQuery } from "@tanstack/react-query";
import type { AudioSermon } from "@/lib/audioSermons";
import { useGlobalAudio } from "@/components/providers/GlobalAudioProvider";
import {
  getProgress,
  clearProgress,
  cleanupOldProgress,
  formatProgressTime,
  PROGRESS_MIN_SECONDS,
  type SavedProgress,
} from "@/utils/sermonProgress";
import { logWarn, logError } from "@/lib/devLog";
import { normalizeSearchQuery } from "@/lib/utils";

// Transcript slug lookup
// Note: WordPress generates slug variants (e.g., slug-2, slug-3) when posts with identical
// titles exist in different categories. We use POST ID as the primary identifier to avoid
// false matches across categories, and include category verification.
interface TranscriptStub {
  slug: string;
  title: string;
  id: number;
  categories: number[]; // Verify category to prevent cross-category matches
  baseSlug?: string; // Slug with numeric suffix removed (e.g., "slug" from "slug-2")
}

/**
 * Strip numeric suffix from WordPress slugs (e.g., "the-gospel-of-christ-2" → "the-gospel-of-christ")
 * UNLESS the transcript title contains an intentional part reference like "Part 2", "pt 2", etc.
 * This handles cases where WordPress generates variant slugs for posts with identical titles,
 * while preserving intentional series continuations.
 */
function getBaseSlug(slug: string, transcriptTitle: string): string {
  const match = slug.match(/-(\d+)$/);
  if (!match) return slug;

  // If that trailing number actually appears in the title (e.g. "Psalm 23",
  // "Part 2", "Acts 2"), the suffix is meaningful — keep the full slug so the
  // link resolves. Only strip it when it's a WordPress collision variant
  // (e.g. "the-gospel-2" for a re-published "The Gospel").
  const num = match[1];
  if (new RegExp(`\\b${num}\\b`).test(transcriptTitle)) {
    return slug;
  }

  return slug.slice(0, match.index);
}

// Read transcript stubs from our cached server route (revalidated hourly), so
// WordPress is queried at most once per hour instead of once per visitor.
async function fetchTranscriptSlugs(): Promise<TranscriptStub[]> {
  try {
    const res = await fetch("/api/wp/transcript-slugs", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      logWarn(
        "Failed to fetch transcript data",
        { status: res.status },
        { tag: "Transcripts" },
      );
      return [];
    }

    const data: {
      items?: {
        slug: string;
        title: string;
        id: number;
        categories: number[];
      }[];
    } = await res.json();

    return (data.items ?? []).map((p) => ({
      slug: p.slug,
      title: p.title,
      id: p.id,
      categories: p.categories,
      baseSlug: getBaseSlug(p.slug, p.title),
    }));
  } catch (err) {
    logError("Failed to load transcript data", err, { tag: "Transcripts" });
    return [];
  }
}

// Spelled-out part numbers → digits, so "Part One" matches "Part 1".
const PART_WORD_TO_NUM: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
};
const PART_WORD_RE =
  /\bpart\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g;

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
      // Normalize part references: "Pt.", "pt", "PT.", "Part" all become "part"
      .replace(/\bpt\.?\s*/gi, "part ")
      // Spelled-out part numbers → digits: "part one" → "part 1"
      .replace(PART_WORD_RE, (_m, w: string) => `part ${PART_WORD_TO_NUM[w]}`)
      // Remove all non-alphanumeric chars except spaces
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Extract the part/series number from a normalized title.
 * Returns the number if found (e.g. "part 2" → 2), or null.
 */
function extractPartNumber(normalizedTitle: string): number | null {
  const match = normalizedTitle.match(/\bpart\s*(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get the "core" title by stripping part/series indicators and trailing numbers.
 * E.g. "the love of god part 2" → "the love of god"
 */
function getCoreTitle(normalizedTitle: string): string {
  return normalizedTitle
    .replace(/\bpart\s*\d+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Common English stop words excluded from word-overlap scoring to prevent
// false matches between titles that share only generic filler words.
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "her",
  "was",
  "one",
  "our",
  "out",
  "has",
  "have",
  "had",
  "its",
  "his",
  "how",
  "man",
  "new",
  "now",
  "old",
  "see",
  "way",
  "who",
  "did",
  "get",
  "let",
  "say",
  "she",
  "too",
  "use",
  "with",
  "that",
  "this",
  "will",
  "your",
  "from",
  "they",
  "been",
  "have",
  "many",
  "some",
  "them",
  "than",
  "each",
  "make",
  "like",
  "into",
  "over",
  "such",
  "what",
  "when",
  "which",
  "their",
  "about",
  "would",
  "there",
  "these",
  "other",
  "could",
  "after",
  "those",
]);

function findTranscriptSlug(
  sermonTitle: string,
  transcripts: TranscriptStub[],
  sermonId?: number,
): string | null {
  const normalizedSermon = normalizeTitle(sermonTitle);
  if (!normalizedSermon) return null;

  const sermonPartNum = extractPartNumber(normalizedSermon);
  const sermonCore = getCoreTitle(normalizedSermon);

  // 1. Exact normalized title match (most reliable)
  for (const t of transcripts) {
    if (normalizeTitle(t.title) === normalizedSermon) {
      return t.slug;
    }
  }

  // 2. Core title + part number match
  //    Matches "The Gospel Part 1" sermon to "The Gospel Pt. 1" transcript
  if (sermonCore) {
    const coreCandidates: { t: TranscriptStub; normTitle: string }[] = [];
    for (const t of transcripts) {
      const normT = normalizeTitle(t.title);
      const tCore = getCoreTitle(normT);
      if (tCore === sermonCore) {
        coreCandidates.push({ t, normTitle: normT });
      }
    }

    if (coreCandidates.length > 0) {
      // If sermon has a part number, find the transcript with the same part number
      if (sermonPartNum !== null) {
        const partMatch = coreCandidates.find(
          (c) => extractPartNumber(c.normTitle) === sermonPartNum,
        );
        if (partMatch) return partMatch.t.slug;
      } else {
        // Sermon has no part number — match transcript without a part number
        const noPartMatch = coreCandidates.find(
          (c) => extractPartNumber(c.normTitle) === null,
        );
        if (noPartMatch) return noPartMatch.t.slug;
        // Fallback: if all transcripts have part numbers, take part 1
        const part1 = coreCandidates.find(
          (c) => extractPartNumber(c.normTitle) === 1,
        );
        if (part1) return part1.t.slug;
      }
    }
  }

  // 3. Substring containment — require part numbers to match when present
  if (normalizedSermon.length >= 10) {
    for (const t of transcripts) {
      const normalizedTranscript = normalizeTitle(t.title);
      if (
        normalizedSermon.includes(normalizedTranscript) ||
        normalizedTranscript.includes(normalizedSermon)
      ) {
        // Verify part numbers are compatible
        const tPartNum = extractPartNumber(normalizedTranscript);
        if (
          sermonPartNum !== null &&
          tPartNum !== null &&
          sermonPartNum !== tPartNum
        ) {
          continue; // Part number mismatch — skip
        }
        if (sermonPartNum !== null && tPartNum === null) {
          continue; // Sermon has part number but transcript doesn't — likely different content
        }
        return t.slug;
      }
    }
  }

  // 4. Word-overlap scoring with part-number awareness
  const sermonWords = new Set(
    normalizedSermon
      .split(" ")
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
  if (sermonWords.size >= 2) {
    let bestMatch: {
      slug: string;
      score: number;
    } | null = null;

    for (const t of transcripts) {
      const normalizedTranscript = normalizeTitle(t.title);
      const transcriptWords = new Set(
        normalizedTranscript
          .split(" ")
          .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
      );
      if (transcriptWords.size === 0) continue;

      // If either has a part number, they must agree
      const tPartNum = extractPartNumber(normalizedTranscript);
      if (
        sermonPartNum !== null &&
        tPartNum !== null &&
        sermonPartNum !== tPartNum
      ) {
        continue;
      }
      if (sermonPartNum !== null && tPartNum === null) {
        continue;
      }
      if (sermonPartNum === null && tPartNum !== null) {
        continue;
      }

      let matchCount = 0;
      for (const w of sermonWords) {
        if (transcriptWords.has(w)) matchCount++;
      }
      const score =
        matchCount / Math.max(sermonWords.size, transcriptWords.size);

      if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          slug: t.slug,
          score,
        };
      }
    }
    if (bestMatch) {
      return bestMatch.slug;
    }
  }

  return null;
}

// =============================================================================
// Playback Progress Persistence
// =============================================================================
// This file used to carry its OWN inline copy of the progress helpers, writing
// to the legacy "nlwc-sermon-progress-" keys. That's why resume never carried
// between this list and the rest of the site. It now uses the shared module,
// which reads/writes the single store (and migrates legacy entries forward).

// =============================================================================
// Main Component
// =============================================================================

export default function SermonsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialise filter state from URL query params
  const [search, setSearch] = useState(
    normalizeSearchQuery(searchParams.get("q") || ""),
  );
  const [debouncedSearch, setDebouncedSearch] = useState(
    normalizeSearchQuery(searchParams.get("q") || ""),
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

  // Audio playback is owned by GlobalAudioProvider (root layout), so it survives
  // navigating away from this list and the persistent bar takes over. This page
  // still owns the *queue* behaviour (auto-play next / shuffle) and the resume
  // prompt — those are list concerns, not element concerns.
  const audio = useGlobalAudio();
  const [loadingSermonId, setLoadingSermonId] = useState<number | null>(null);

  // Resume playback state
  const [resumePrompt, setResumePrompt] = useState<{
    sermon: AudioSermon;
    savedProgress: SavedProgress;
  } | null>(null);

  // Transcript overlay state
  const [transcriptOverlay, setTranscriptOverlay] = useState<{
    isOpen: boolean;
    slug: string;
    title: string;
    speaker?: string;
  }>({
    isOpen: false,
    slug: "",
    title: "",
  });

  // Cleanup old progress on mount
  useEffect(() => {
    cleanupOldProgress();
  }, []);

  // Progress saving (periodic, on pause, and on unload) is centralised in
  // GlobalAudioProvider now — it owns the element, so it can save reliably even
  // after this list unmounts.

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
    staleTime: 30 * 60 * 1000, // 30 minutes — slugs change infrequently
    gcTime: 24 * 60 * 60 * 1000, // 24 hours — keep in cache to prevent frequent refetches
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
        }
      }
      setLoadingSermonId(null);

      // Check for saved progress (shared store — a position saved anywhere else
      // on the site is offered here too).
      const saved = getProgress(sermonToPlay.id);
      if (saved && saved.currentTime >= PROGRESS_MIN_SECONDS) {
        setResumePrompt({ sermon: sermonToPlay, savedProgress: saved });
      } else {
        startPlayback(sermonToPlay, 0);
      }
    },
    [fetchSermonDetail, audio, startPlayback],
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

  // Hand the current list to the provider as the playback queue. Auto-play-next
  // and shuffle live there now, so they keep working after the listener
  // navigates away from this page (previously the queue died with this
  // component). Listings often have no downloadUrl yet, so we also pass a
  // resolver that fetches the detail on demand.
  const { setQueue } = audio;
  useEffect(() => {
    setQueue(
      sermons.map((s) => ({
        id: s.id,
        title: s.title,
        speaker: s.speaker,
        series: s.series,
        thumbnailUrl: s.thumbnailUrl,
        src: s.downloadUrl || "",
        downloadUrl: s.downloadUrl,
        href: `/sermons/audio/${s.id}`,
      })),
      async (id) => {
        const detail = await fetchSermonDetail(Number(id));
        return detail?.downloadUrl || null;
      },
    );
  }, [sermons, setQueue, fetchSermonDetail]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Transcript Overlay */}
      <TranscriptOverlay
        isOpen={transcriptOverlay.isOpen}
        slug={transcriptOverlay.slug}
        title={transcriptOverlay.title}
        speaker={transcriptOverlay.speaker}
        onClose={() =>
          setTranscriptOverlay({
            isOpen: false,
            slug: "",
            title: "",
          })
        }
      />

      {/* The <audio> element and progress saving live in GlobalAudioProvider. */}

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
              onChange={(e) => setSearch(normalizeSearchQuery(e.target.value))}
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
                    isActive={audio.isCurrent(sermon.id)}
                    isPlaying={audio.isCurrent(sermon.id) && audio.isPlaying}
                    isLoadingDetail={loadingSermonId === sermon.id}
                    onPlay={() => handlePlay(sermon)}
                    onPause={audio.toggle}
                    transcriptSlugs={transcriptSlugs}
                    onTranscriptClick={(slug, title, speaker) =>
                      setTranscriptOverlay({
                        isOpen: true,
                        slug,
                        title,
                        speaker,
                      })
                    }
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

      {/* The sticky bar, full-screen mobile player and bottom spacer now
          live in GlobalAudioProvider (root layout), so playback and its
          controls survive navigating away from this list. */}
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
  onTranscriptClick,
}: {
  sermon: AudioSermon;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLoadingDetail: boolean;
  onPlay: () => void;
  onPause: () => void;
  transcriptSlugs: TranscriptStub[];
  onTranscriptClick: (slug: string, title: string, speaker?: string) => void;
}) {
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

          {/* Transcript Link — overlay for matched transcript, or navigate for transcripts page */}
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
