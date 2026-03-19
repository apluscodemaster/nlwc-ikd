"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { useTranscripts } from "@/hooks/useWordPress";
import TranscriptCard from "./TranscriptCard";
import { TRANSCRIPT_CATEGORIES } from "@/lib/wordpress";

interface TranscriptsListProps {
  initialPage?: number;
  perPage?: number;
}

export default function TranscriptsList({
  initialPage = 1,
  perPage = 9,
}: TranscriptsListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlPage = searchParams.get("page");
  const urlCategory = searchParams.get("category") || "";
  const parsedPage = urlPage ? parseInt(urlPage, 10) : initialPage;
  const initialSearch = searchParams.get("q") || "";

  const [page, setPage] = useState(
    !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : initialPage,
  );
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isFirstRender = useRef(true);
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (!isFirstRender.current) {
        setPage(1); // Reset to first page on new search
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Sync to URL
  useEffect(() => {
    if (isFirstRender.current) return;

    const params = new URLSearchParams(searchParams.toString());

    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      params.delete("q");
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    const currentUrlPage = searchParams.get("page") || "";
    const currentUrlQ = searchParams.get("q") || "";
    const currentUrlCategory = searchParams.get("category") || "";
    const newUrlPage = params.get("page") || "";
    const newUrlQ = params.get("q") || "";
    const newUrlCategory = params.get("category") || "";

    if (
      currentUrlPage !== newUrlPage ||
      currentUrlQ !== newUrlQ ||
      currentUrlCategory !== newUrlCategory
    ) {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }
  }, [page, debouncedSearch, selectedCategory, pathname, router, searchParams]);

  const categoryParam = selectedCategory
    ? isNaN(Number(selectedCategory))
      ? (selectedCategory as unknown as number)
      : parseInt(selectedCategory, 10)
    : undefined;

  const { data, isLoading, isError, error } = useTranscripts(
    page,
    perPage,
    debouncedSearch || undefined,
    categoryParam,
  );

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger client-side cache invalidation
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedCategory) params.append("category", selectedCategory);

      await fetch(`/api/transcripts?${params.toString()}`, {
        cache: "no-cache",
      });

      // Refetch data
      window.location.href =
        pathname +
        (searchParams.toString() ? `?${searchParams.toString()}` : "");
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const transcripts = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="w-full">
      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search Bar and Controls */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transcripts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-14 pr-4 rounded-2xl border border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm placeholder:text-muted-foreground"
            />
          </div>

          {/* Category Filter and Refresh */}
          <div className="space-y-3">
            {/* Category Tabs - Horizontal Scrollable on Mobile, Grid on Desktop */}
            <div className="w-full">
              {/* Mobile: Horizontal Scrollable */}
              <div className="lg:hidden overflow-x-auto -mx-2 px-2">
                <div className="flex gap-2 pb-2">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`px-4 py-2 rounded-full font-medium transition-all text-sm whitespace-nowrap shrink-0 ${
                      !selectedCategory
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Transcripts
                  </button>
                  {Object.entries(TRANSCRIPT_CATEGORIES).map(
                    ([catId, category]) => (
                      <motion.button
                        key={catId}
                        onClick={() => {
                          setSelectedCategory(
                            catId === selectedCategory ? "" : catId,
                          );
                          setPage(1);
                        }}
                        className={`px-4 py-2 rounded-full font-medium transition-all text-sm whitespace-nowrap shrink-0 ${
                          String(catId) === selectedCategory
                            ? "bg-primary text-white shadow-lg shadow-primary/30"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {category.name}
                      </motion.button>
                    ),
                  )}
                </div>
              </div>

              {/* Desktop: Full-Width Grid */}
              <div className="hidden lg:flex gap-2 flex-wrap items-center justify-center">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                    !selectedCategory
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Transcripts
                </button>
                {Object.entries(TRANSCRIPT_CATEGORIES).map(
                  ([catId, category]) => (
                    <motion.button
                      key={catId}
                      onClick={() => {
                        setSelectedCategory(
                          catId === selectedCategory ? "" : catId,
                        );
                        setPage(1);
                      }}
                      className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                        String(catId) === selectedCategory
                          ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {category.name}
                    </motion.button>
                  ),
                )}
              </div>
            </div>

            {/* Refresh Button - Full Width */}
            <div className="flex justify-center">
              <motion.button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="px-6 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Refresh content from WordPress"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={{
                    duration: 1,
                    repeat: isRefreshing ? Infinity : 0,
                    ease: "linear",
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium text-lg">
              Loading transcripts...
            </p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <BookOpen className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Failed to load transcripts
            </h3>
            <p className="text-muted-foreground max-w-xs">
              {error instanceof Error
                ? error.message
                : "Please try again later."}
            </p>
          </div>
        )}

        {/* Transcripts Grid */}
        {!isLoading && !isError && (
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {transcripts.map((transcript) => (
                <TranscriptCard
                  key={transcript.id}
                  transcript={transcript}
                  searchQuery={debouncedSearch}
                />
              ))}

              {transcripts.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No transcripts found
                  </h3>
                  <p className="text-muted-foreground">
                    {debouncedSearch
                      ? `No results for "${debouncedSearch}"`
                      : "Check back later for new content."}
                  </p>
                  {debouncedSearch && (
                    <button
                      onClick={() => setSearch("")}
                      className="mt-6 px-6 py-2 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-center gap-6 pt-12">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Total Count */}
        {pagination && (
          <p className="text-center text-sm text-muted-foreground">
            Showing {transcripts.length} of {pagination.total} transcripts
          </p>
        )}
      </div>
    </div>
  );
}
