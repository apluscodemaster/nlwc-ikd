"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSermons, type Sermon } from "@/hooks/useWordPress";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

interface SermonsListProps {
  perPage?: number;
}

export default function SermonsList({ perPage = 9 }: SermonsListProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, error } = useSermons(
    page,
    perPage,
    debouncedSearch || undefined,
  );

  const sermons = data?.sermons || [];
  const pagination = data?.pagination;

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search sermons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-14 pl-14 pr-4 rounded-2xl border border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm placeholder:text-muted-foreground"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium text-lg">
            Loading sermons...
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
            Failed to load sermons
          </h3>
          <p className="text-muted-foreground max-w-xs">
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
        </div>
      )}

      {/* Sermons Grid */}
      {!isLoading && !isError && (
        <AnimatePresence mode="wait">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sermons.map((sermon) => (
              <SermonCard key={sermon.id} sermon={sermon} />
            ))}

            {sermons.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No sermons found
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

      {/* Count */}
      {pagination && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {sermons.length} of {pagination.total} sermons
        </p>
      )}
    </div>
  );
}

// Sermon Card Component
function SermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Link
        href={sermon.link}
        className="block w-full overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            Sunday Message
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">
            {sermon.date}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-2 wrap-break-word">
          {sermon.title}
        </h3>

        {/* Speaker */}
        {sermon.speaker && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
            <span className="truncate">{sermon.speaker}</span>
          </div>
        )}

        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4 wrap-break-word">
          {sermon.excerpt || "Read the full transcript of this message..."}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 text-primary font-bold text-xs sm:text-sm group-hover:gap-2 transition-all">
            Read Transcript
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
