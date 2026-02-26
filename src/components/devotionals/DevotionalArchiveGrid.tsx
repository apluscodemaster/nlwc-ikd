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
} from "lucide-react";
import { getPublishedDevotionals, Devotional } from "@/lib/devotionals";
import { DocumentSnapshot } from "firebase/firestore";

const PAGE_SIZE = 12;

export default function DevotionalArchiveGrid() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (cursor?: DocumentSnapshot) => {
    const result = await getPublishedDevotionals(
      PAGE_SIZE,
      cursor || undefined,
    );
    return result;
  }, []);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium text-lg">
          Loading devotionals...
        </p>
      </div>
    );
  }

  if (devotionals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-primary/40" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No Devotionals Yet
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Check back soon for daily devotional materials to enrich your
          spiritual walk.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {devotionals.map((devotional, index) => (
          <motion.div
            key={devotional.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Link
              href={`/devotionals/${devotional.id}`}
              className="group block h-full rounded-3xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden"
            >
              {/* Top gradient accent */}
              <div className="h-1 w-full bg-linear-to-r from-primary/60 via-amber-400/60 to-primary/60 group-hover:from-primary group-hover:via-amber-400 group-hover:to-primary transition-all" />

              <div className="p-6">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {devotional.title}
                </h3>

                {/* Date */}
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {devotional.scheduledDate
                    .toDate()
                    .toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-12">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700 transition-all disabled:opacity-60"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
