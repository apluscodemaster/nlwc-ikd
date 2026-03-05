"use client";

import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Filter,
  X,
} from "lucide-react";
import { useManuals } from "@/hooks/useWordPress";
import { useQuery } from "@tanstack/react-query";
import ManualCard from "./ManualCard";

interface ManualsListProps {
  initialPage?: number;
  perPage?: number;
}

// Fetch unique themes from the API
async function fetchThemes(): Promise<string[]> {
  try {
    const res = await fetch("/api/manuals/themes");
    if (!res.ok) return [];
    const json = await res.json();
    return json.themes || [];
  } catch {
    return [];
  }
}

export default function ManualsList({
  initialPage = 1,
  perPage = 9,
}: ManualsListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlPage = searchParams.get("page");
  const parsedPage = urlPage ? parseInt(urlPage, 10) : initialPage;
  const initialSearch = searchParams.get("q") || "";
  const initialSeries = searchParams.get("series") || "";

  const [page, setPage] = useState(
    !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : initialPage,
  );
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedSeries, setSelectedSeries] = useState(initialSeries);
  const [showFilters, setShowFilters] = useState(!!initialSeries);

  const isFirstRender = useRef(true);
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  // Fetch available themes/series
  const { data: themes = [] } = useQuery({
    queryKey: ["manual-themes"],
    queryFn: fetchThemes,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (!isFirstRender.current) {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when series filter changes
  useEffect(() => {
    if (!isFirstRender.current) {
      setPage(1);
    }
  }, [selectedSeries]);

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

    if (selectedSeries) {
      params.set("series", selectedSeries);
    } else {
      params.delete("series");
    }

    const currentUrlPage = searchParams.get("page") || "";
    const currentUrlQ = searchParams.get("q") || "";
    const currentUrlSeries = searchParams.get("series") || "";
    const newUrlPage = params.get("page") || "";
    const newUrlQ = params.get("q") || "";
    const newUrlSeries = params.get("series") || "";

    if (
      currentUrlPage !== newUrlPage ||
      currentUrlQ !== newUrlQ ||
      currentUrlSeries !== newUrlSeries
    ) {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }
  }, [page, debouncedSearch, selectedSeries, pathname, router, searchParams]);

  // Combine search and series for the API query
  const combinedSearch = [debouncedSearch, selectedSeries]
    .filter(Boolean)
    .join(" ");

  const { data, isLoading, isError, error } = useManuals(
    page,
    perPage,
    combinedSearch || undefined,
  );

  const manuals = data?.data || [];
  const pagination = data?.pagination;

  // Shorten long theme names for pills
  function shortenTheme(theme: string): string {
    if (theme.length <= 35) return theme;
    // Try to find a natural break point
    const semicolonIdx = theme.indexOf(";");
    if (semicolonIdx > 0 && semicolonIdx <= 40) {
      return theme.slice(0, semicolonIdx).trim();
    }
    return theme.slice(0, 35).replace(/\s+\S*$/, "") + "…";
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search manuals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-14 pl-14 pr-14 rounded-2xl border border-gray-200 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-gray-900 shadow-sm placeholder:text-muted-foreground"
        />
        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-6 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
            showFilters || selectedSeries
              ? "bg-amber-500 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
          }`}
          title="Filter by series"
          aria-label="Toggle series filter"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Series Filter Pills */}
      <AnimatePresence>
        {showFilters && themes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="max-w-4xl mx-auto px-2">
              <div className="flex items-center gap-2 mb-3">
                <BookMarked className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-gray-700">
                  Filter by Series
                </span>
                {selectedSeries && (
                  <button
                    onClick={() => setSelectedSeries("")}
                    className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => {
                  const isSelected = selectedSeries === theme;
                  return (
                    <button
                      key={theme}
                      onClick={() => setSelectedSeries(isSelected ? "" : theme)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        isSelected
                          ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                          : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50"
                      }`}
                      title={theme}
                    >
                      {shortenTheme(theme)}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Badge */}
      {selectedSeries && !showFilters && (
        <div className="max-w-4xl mx-auto px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm text-amber-700">
            <BookMarked className="w-3.5 h-3.5" />
            <span className="font-medium">{shortenTheme(selectedSeries)}</span>
            <button
              onClick={() => setSelectedSeries("")}
              className="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-amber-200 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-muted-foreground font-medium text-lg">
            Loading manuals...
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <BookMarked className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to load manuals
          </h3>
          <p className="text-muted-foreground max-w-xs">
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
        </div>
      )}

      {/* Manuals Grid */}
      {!isLoading && !isError && (
        <AnimatePresence mode="wait">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {manuals.map((manual) => (
              <ManualCard
                key={manual.id}
                manual={manual}
                searchQuery={debouncedSearch}
              />
            ))}

            {manuals.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookMarked className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No manuals found
                </h3>
                <p className="text-muted-foreground">
                  {debouncedSearch || selectedSeries
                    ? `No results for ${[debouncedSearch && `"${debouncedSearch}"`, selectedSeries && `series "${shortenTheme(selectedSeries)}"`].filter(Boolean).join(" in ")}`
                    : "Check back later for new content."}
                </p>
                {(debouncedSearch || selectedSeries) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedSeries("");
                    }}
                    className="mt-6 px-6 py-2 rounded-full bg-amber-500/10 text-amber-600 font-bold hover:bg-amber-500/20 transition-colors"
                  >
                    Clear filters
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
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-amber-500 hover:text-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                          ? "bg-amber-500 text-white scale-105 sm:scale-110 shadow-lg shadow-amber-500/20"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-amber-500 hover:text-amber-500"
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
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:border-amber-500 hover:text-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
          Showing {manuals.length} of {pagination.total} manuals
        </p>
      )}
    </div>
  );
}
