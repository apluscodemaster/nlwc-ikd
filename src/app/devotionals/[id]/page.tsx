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
  Share2,
} from "lucide-react";
import {
  getDevotionalById,
  getAdjacentDevotionals,
  Devotional,
} from "@/lib/devotionals";
import PageHeader from "@/components/shared/PageHeader";
import DevotionalSidebar from "@/components/devotionals/DevotionalSidebar";
import { toast } from "sonner";

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50/30">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <BookOpen className="w-8 h-8 text-primary absolute inset-0 m-auto" />
        </div>
        <p className="text-muted-foreground font-bold text-xl animate-pulse">
          Opening the word...
        </p>
      </div>
    );
  }

  if (error || !devotional) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-gray-50/30">
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center shadow-inner">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">
          {error || "Devotional not found"}
        </h2>
        <p className="text-gray-500 mb-6 font-medium">
          It might have been moved or removed.
        </p>
        <Link
          href="/devotionals"
          className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Library className="w-5 h-5" />
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

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: devotional.title,
          text: `Check out today's devotional: ${devotional.title}`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <main className="bg-gray-50/30 min-h-screen">
      <PageHeader
        title={devotional.title}
        subtitle="Daily Devotional"
        backgroundImage="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop"
      />

      <section className="py-12 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12 lg:gap-16 items-start">
            {/* Main Content Area */}
            <div className="space-y-8">
              {/* Breadcrumbs & Actions Row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest">
                    <Calendar className="w-4 h-4" />
                    {formattedDate}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                    {devotional.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-gray-100 text-gray-600 hover:text-primary hover:bg-primary/5 shadow-sm transition-all"
                    title="Share Devotional"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <a
                    href={devotional.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                </div>
              </motion.div>

              {/* Reader Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative rounded-[40px] overflow-hidden border border-white bg-white shadow-2xl shadow-gray-200/50"
              >
                {/* Visual Accent */}
                <div className="h-1.5 w-full bg-linear-to-r from-primary via-amber-400 to-primary" />

                <div className="p-2 sm:p-4">
                  <div
                    className="relative w-full rounded-[28px] overflow-hidden bg-gray-100 shadow-inner"
                    style={{ height: "85vh", minHeight: "750px" }}
                  >
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(devotional.pdfUrl)}&embedded=true`}
                      className="w-full h-full border-none"
                      title={devotional.title}
                    />

                    {/* Floating Expand Tool */}
                    <div className="absolute top-6 right-6 flex items-center gap-3">
                      <a
                        href={devotional.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white shadow-xl text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-105"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Focus Mode
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
                {prev && (
                  <Link
                    href={`/devotionals/${prev.id}`}
                    className="group flex items-center gap-6 p-6 rounded-3xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0">
                      <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                        Previous
                      </p>
                      <h4 className="text-base font-bold text-gray-900 truncate">
                        {prev.title}
                      </h4>
                    </div>
                  </Link>
                )}

                {next && (
                  <Link
                    href={`/devotionals/${next.id}`}
                    className="group flex items-center justify-end gap-6 p-6 rounded-3xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all text-right ml-auto w-full"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                        Next
                      </p>
                      <h4 className="text-base font-bold text-gray-900 truncate">
                        {next.title}
                      </h4>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0">
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="sticky top-28 space-y-12">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <DevotionalSidebar currentId={id} />
              </motion.div>

              {/* Quick Support / Message Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="p-8 rounded-[32px] bg-linear-to-br from-primary to-amber-500 text-white shadow-xl shadow-primary/20 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <h4 className="text-xl font-bold mb-3 relative z-10">
                  Help A Friend Grow
                </h4>
                <p className="text-white/80 text-sm mb-6 relative z-10">
                  If these materials have blessed you, consider sharing with
                  others to spread the word of God.
                </p>
                <button
                  onClick={handleShare}
                  className="w-full py-4 rounded-xl bg-white text-primary font-bold text-sm shadow-lg hover:bg-gray-50 transition-all relative z-10"
                >
                  Spread the Word
                </button>
              </motion.div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
