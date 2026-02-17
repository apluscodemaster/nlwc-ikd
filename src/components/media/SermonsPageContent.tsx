"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { useAudioSermons, useFilterOptions } from "@/hooks/useAudioSermons";
import type { AudioSermon } from "@/lib/audioSermons";

// =============================================================================
// Main Component
// =============================================================================

export default function SermonsPageContent() {
  // Filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSeries, setSelectedSeries] = useState<number | undefined>();
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | undefined>();
  const [selectedTopic, setSelectedTopic] = useState<number | undefined>();
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Audio player state
  const [activeSermon, setActiveSermon] = useState<AudioSermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    order: sortOrder,
  });

  const {
    series,
    speakers,
    topics,
    isLoading: filtersLoading,
  } = useFilterOptions();

  // Page changes
  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedSeries, selectedSpeaker, selectedTopic, sortOrder]);

  // Active filter count
  const activeFilterCount = [
    selectedSeries,
    selectedSpeaker,
    selectedTopic,
  ].filter(Boolean).length;

  // Clear filters
  const clearAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedSeries(undefined);
    setSelectedSpeaker(undefined);
    setSelectedTopic(undefined);
    setSortOrder("DESC");
    setPage(1);
  };

  // ==========================================================================
  // Audio player controls
  // ==========================================================================
  const handlePlay = useCallback(
    async (sermon: AudioSermon) => {
      setIsLoadingDetail(true);
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
    <div className="space-y-6 sm:space-y-8">
      {/* Hidden Audio */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  options: { value: number; label: string; count: number }[];
  onChange: (value: number | undefined) => void;
  isLoading: boolean;
  id: string;
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
            {opt.label} ({opt.count})
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
}: {
  sermon: AudioSermon;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLoadingDetail: boolean;
  onPlay: () => void;
  onPause: () => void;
}) {
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

          {/* Transcript Link — navigates to /sermons/[slug] */}
          <Link
            href={`/sermons/${slugify(sermon.title)}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-500 hover:text-primary hover:bg-primary/5 transition-all"
            title="Read Transcript"
            id={`transcript-sermon-${sermon.id}`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Transcript</span>
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
