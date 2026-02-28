"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  Download,
  Library,
  ExternalLink,
} from "lucide-react";
import {
  getDevotionalById,
  getAdjacentDevotionals,
  Devotional,
} from "@/lib/devotionals";
import PageHeader from "@/components/shared/PageHeader";

export default function DevotionalViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [prev, setPrev] = useState<Devotional | null>(null);
  const [next, setNext] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getDevotionalById(id)
      .then(async (d) => {
        if (!d) {
          setError("Devotional not found.");
          setLoading(false);
          return;
        }
        setDevotional(d);

        const adj = await getAdjacentDevotionals(d.scheduledDate);
        setPrev(adj.prev);
        setNext(adj.next);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load devotional.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium text-lg">
          Loading devotional...
        </p>
      </div>
    );
  }

  if (error || !devotional) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {error || "Not Found"}
        </h2>
        <Link
          href="/devotionals"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Library className="w-4 h-4" />
          Browse Archive
        </Link>
      </div>
    );
  }

  const formattedDate = devotional.scheduledDate
    .toDate()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <main>
      <PageHeader
        title={devotional.title}
        subtitle="Daily Devotional"
        backgroundImage="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop"
      />

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs & Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/devotionals"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Archive
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                {devotional.title}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </div>
          </motion.div>

          {/* Reading Interface */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                <BookOpen className="w-5 h-5 text-primary" />
                Reading Mode
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={devotional.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              </div>
            </div>

            {/* Viewer */}
            <div className="relative rounded-3xl overflow-hidden border border-gray-200/60 shadow-2xl bg-white group">
              <div className="h-1.5 w-full bg-linear-to-r from-primary via-amber-400 to-primary" />

              <div className="p-1 sm:p-2 bg-gray-50">
                <div
                  className="relative w-full rounded-2xl overflow-hidden bg-white"
                  style={{ height: "85vh", minHeight: "700px" }}
                >
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(devotional.pdfUrl)}&embedded=true`}
                    className="w-full h-full border-none"
                    title={devotional.title}
                  />

                  {/* Overlay for readers with float tools */}
                  <div className="absolute top-4 right-4 flex items-center gap-3">
                    <a
                      href={devotional.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-200 shadow-2xl text-sm font-bold text-primary hover:bg-primary hover:text-white hover:scale-105 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Full Screen
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Prev / Next navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8"
          >
            {prev ? (
              <Link
                href={`/devotionals/${prev.id}`}
                className="group flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0">
                  <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Previous
                  </p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {prev.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/devotionals/${next.id}`}
                className="group flex items-center justify-end gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all text-right"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Next
                  </p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {next.title}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0">
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                </div>
              </Link>
            ) : (
              <div />
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
