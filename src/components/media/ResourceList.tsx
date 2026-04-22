"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, FileText, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Shapes returned by the existing API routes ───────────────────────────────
interface ManualItem {
  id: number;
  title: string;
  slug: string;
  formattedDate: string;
  excerpt: string;
  readingTime: number;
}

interface TranscriptItem {
  id: number;
  title: string;
  slug: string;
  formattedDate: string;
  excerpt: string;
  categories: string[];
  readingTime: number;
}

// ─── Unified row shape ────────────────────────────────────────────────────────
interface ResourceRow {
  id: string;
  title: string;
  category: string;
  date: string;
  readingTime: number;
  href: string;
  kind: "manual" | "transcript";
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchManuals(): Promise<ResourceRow[]> {
  const res = await fetch("/api/manuals?per_page=5");
  if (!res.ok) throw new Error("manuals fetch failed");
  const json = await res.json();
  return (json.data as ManualItem[]).map((m) => ({
    id: `manual-${m.id}`,
    title: m.title,
    category: "Sunday School Manual",
    date: m.formattedDate,
    readingTime: m.readingTime,
    href: `/manuals/${m.slug}`,
    kind: "manual",
  }));
}

async function fetchTranscripts(): Promise<ResourceRow[]> {
  const res = await fetch("/api/transcripts?per_page=5");
  if (!res.ok) throw new Error("transcripts fetch failed");
  const json = await res.json();
  return (json.data as TranscriptItem[]).map((t) => ({
    id: `transcript-${t.id}`,
    title: t.title,
    category: t.categories?.[0] ?? "Transcript",
    date: t.formattedDate,
    readingTime: t.readingTime,
    href: `/transcripts/${t.slug}`,
    kind: "transcript",
  }));
}

// ─── Row skeleton ─────────────────────────────────────────────────────────────
function RowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm gap-4">
      <div className="flex items-center gap-5 flex-1">
        <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="flex gap-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-12 w-28 rounded-xl shrink-0" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ResourceList() {
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch manuals + transcripts in parallel; gracefully handle partial failure
      const [manualResults, transcriptResults] = await Promise.allSettled([
        fetchManuals(),
        fetchTranscripts(),
      ]);

      const manuals =
        manualResults.status === "fulfilled" ? manualResults.value : [];
      const transcripts =
        transcriptResults.status === "fulfilled" ? transcriptResults.value : [];

      if (manuals.length === 0 && transcripts.length === 0) {
        throw new Error("No resources available");
      }

      // Interleave: manual, transcript, manual, transcript…
      const merged: ResourceRow[] = [];
      const maxLen = Math.max(manuals.length, transcripts.length);
      for (let i = 0; i < maxLen; i++) {
        if (manuals[i]) merged.push(manuals[i]);
        if (transcripts[i]) merged.push(transcripts[i]);
      }

      setRows(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {[1, 2, 3, 4].map((i) => (
          <RowSkeleton key={i} />
        ))}
      </motion.div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-red-50/40 rounded-3xl border border-red-100"
      >
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600 font-medium">
          Could not load resources right now.
        </p>
        <button
          onClick={load}
          className="flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-white text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    );
  }

  // ── List ───────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {rows.map((row, index) => {
        const Icon = row.kind === "manual" ? BookOpen : FileText;
        const iconBg =
          row.kind === "manual"
            ? "bg-amber-50 group-hover:bg-amber-100 text-amber-600"
            : "bg-blue-50 group-hover:bg-blue-100 text-blue-600";
        const badgeColor =
          row.kind === "manual"
            ? "bg-amber-50 text-amber-700"
            : "bg-blue-50 text-blue-700";

        return (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex items-center gap-5 min-w-0">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${iconBg}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                    {row.title}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full shrink-0 ${badgeColor}`}
                  >
                    {row.kind === "manual" ? "Manual" : "Transcript"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                  <span>{row.date}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="line-clamp-1">{row.category}</span>
                  {row.readingTime > 0 && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>{row.readingTime} min read</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 shrink-0">
              <Link
                href={row.href}
                className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gray-50 text-gray-900 font-bold hover:bg-primary hover:text-white transition-all shadow-sm text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Read
              </Link>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
