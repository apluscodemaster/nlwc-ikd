"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Loader2,
  FileText,
  ChevronDown,
  Search,
  ArrowRight,
} from "lucide-react";
import { getPublishedDevotionals, Devotional } from "@/lib/devotionals";
import { DocumentSnapshot } from "firebase/firestore";
import FeaturedDevotional from "./FeaturedDevotional";

const PAGE_SIZE = 12;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DevotionalArchiveGrid() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search, Filter & Layout state
  const [searchQuery, setSearchQuery] = useState("");
  const [month, setMonth] = useState<number | "all">("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");

  const fetchPage = useCallback(
    async (cursor?: DocumentSnapshot) => {
      const filter =
        month === "all" ? undefined : { month: month as number, year };
      const result = await getPublishedDevotionals(
        PAGE_SIZE,
        cursor || undefined,
        filter,
      );
      return result;
    },
    [month, year],
  );

  useEffect(() => {
    setLoading(true);
    fetchPage().then((result) => {
      setDevotionals(result.devotionals);
      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
      setLoading(false);
    });
  }, [fetchPage]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    const result = await fetchPage(lastDoc);
    setDevotionals((prev) => [...prev, ...result.devotionals]);
    setLastDoc(result.lastVisible);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  };

  // Filtered devotionals based on search query
  const filteredDevotionals = devotionals.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const yearsList = [2024, 2025, 2026];

  const isFiltering = month !== "all" || searchQuery !== "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Featured Section - Only show when not searching or filtering */}
      {!isFiltering && devotionals.length > 0 && (
        <FeaturedDevotional devotional={devotionals[0]} />
      )}

      {/* Header with Filters and Search */}
      <div className="flex flex-col gap-8 mb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search devotionals by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-100 bg-white/50 backdrop-blur-sm text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Layout Toggle */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl mr-2">
              <button
                onClick={() => setViewLayout("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewLayout === "grid"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Grid View"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewLayout("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewLayout === "list"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="List View"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Month
              </label>
              <select
                value={month}
                onChange={(e) =>
                  setMonth(
                    e.target.value === "all" ? "all" : parseInt(e.target.value),
                  )
                }
                className="h-12 px-4 rounded-xl border border-gray-100 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
              >
                <option value="all">All Months</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="h-12 px-4 rounded-xl border border-gray-100 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {(month !== "all" || searchQuery !== "") && (
              <button
                onClick={() => {
                  setMonth("all");
                  setSearchQuery("");
                }}
                className="h-12 px-6 rounded-xl bg-gray-50 text-sm font-bold text-gray-500 hover:text-primary hover:bg-primary/5 transition-all shadow-sm"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-gray-900 whitespace-nowrap">
            {isFiltering ? "Search Results" : "More Devotionals"}
          </h3>
          <div className="h-px w-full bg-gray-100" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
          <p className="text-muted-foreground font-medium text-xl">
            Gathering devotionals...
          </p>
        </div>
      ) : filteredDevotionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-8 shadow-sm">
            <FileText className="w-12 h-12 text-gray-200" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No devotionals found
          </h3>
          <p className="text-muted-foreground text-center max-w-md text-lg">
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}".`
              : month === "all"
                ? "Our archive is growing. Check back soon for more materials."
                : `We don't have records for ${MONTHS[month as number]} ${year} yet.`}
          </p>
          {(month !== "all" || searchQuery !== "") && (
            <button
              onClick={() => {
                setMonth("all");
                setSearchQuery("");
              }}
              className="mt-8 h-12 px-8 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Browse All Devotionals
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Main Content Area: Grid or List */}
          <div
            className={
              viewLayout === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                : "flex flex-col gap-4"
            }
          >
            {filteredDevotionals
              .slice(!isFiltering ? 1 : 0) // Skip the first one if it's shown as featured
              .map((devotional, index) => (
                <motion.div
                  key={devotional.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    href={`/devotionals/${devotional.id}`}
                    className={`group block overflow-hidden border border-gray-100 transition-all ${
                      viewLayout === "grid"
                        ? "h-full rounded-[32px] bg-white p-8 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5"
                        : "rounded-2xl bg-white p-4 sm:p-6 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                    }`}
                  >
                    <div
                      className={
                        viewLayout === "grid"
                          ? "flex flex-col h-full"
                          : "flex items-center gap-4 sm:gap-8"
                      }
                    >
                      {/* Icon */}
                      <div
                        className={`flex items-center justify-center rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors shrink-0 ${
                          viewLayout === "grid"
                            ? "w-14 h-14 mb-6"
                            : "w-12 h-12 sm:w-16 sm:h-16"
                        }`}
                      >
                        <BookOpen
                          className={
                            viewLayout === "grid"
                              ? "w-7 h-7 text-primary"
                              : "w-6 h-6 sm:w-8 sm:h-8 text-primary"
                          }
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={
                            viewLayout === "grid"
                              ? "flex items-center justify-between mb-2"
                              : "flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1"
                          }
                        >
                          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {devotional.scheduledDate
                              .toDate()
                              .toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                          </span>
                          {viewLayout === "grid" && (
                            <div className="text-xs font-bold text-gray-300">
                              #{(index + 1).toString().padStart(2, "0")}
                            </div>
                          )}
                        </div>

                        <h3
                          className={`font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight truncate ${
                            viewLayout === "grid"
                              ? "text-xl mb-4"
                              : "text-base sm:text-xl mb-1 sm:mb-2"
                          }`}
                        >
                          {devotional.title}
                        </h3>

                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {devotional.scheduledDate
                            .toDate()
                            .toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "long",
                              day: "numeric",
                            })}
                        </p>
                      </div>

                      {/* Footer / CTA Action */}
                      {viewLayout === "grid" ? (
                        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-sm font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            Read Now
                          </span>
                          <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300">
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ) : (
                        <div className="hidden sm:flex items-center gap-3 ml-auto px-4 py-2 rounded-xl bg-gray-50 group-hover:bg-primary group-hover:text-white transition-all">
                          <span className="text-sm font-bold">Read</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>

          {/* Load More */}
          {hasMore && !searchQuery && (
            <div className="flex justify-center mt-20">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-3 h-14 px-10 rounded-full bg-white border border-gray-100 text-gray-700 font-bold hover:bg-gray-50 hover:border-primary/20 shadow-sm transition-all disabled:opacity-60 scale-hover"
              >
                {loadingMore ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
                {loadingMore ? "Loading..." : "View More Materials"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
