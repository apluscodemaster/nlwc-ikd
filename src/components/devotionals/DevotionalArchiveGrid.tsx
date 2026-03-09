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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [month, setMonth] = useState<number | "all">("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());

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
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDevotionals
              .slice(!isFiltering ? 1 : 0) // Skip the first one if it's shown as featured
              .map((devotional, index) => (
                <motion.div
                  key={devotional.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Link
                    href={`/devotionals/${devotional.id}`}
                    className="group block h-full rounded-[32px] border border-gray-100 bg-white p-8 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all scroll-mt-24"
                  >
                    <div className="flex flex-col h-full">
                      {/* Icon & Date */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <BookOpen className="w-7 h-7 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                          {devotional.scheduledDate
                            .toDate()
                            .toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {devotional.title}
                      </h3>

                      {/* Explicit Date */}
                      <p className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                        <Calendar className="w-4 h-4" />
                        {devotional.scheduledDate
                          .toDate()
                          .toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "long",
                            day: "numeric",
                          })}
                      </p>

                      {/* Footer */}
                      <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-sm font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                          Read Now
                        </span>
                        <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-300">
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
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
