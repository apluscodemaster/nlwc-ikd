"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Share2,
} from "lucide-react";
import type { DevotionalLink, DevotionalViewData } from "./data";
import PageHeader from "@/components/shared/PageHeader";
import DevotionalSidebar from "@/components/devotionals/DevotionalSidebar";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL, PUBLISHER } from "@/utils/seo";
import { toast } from "sonner";
import PdfViewer from "@/components/devotionals/PdfViewer";

/**
 * The devotional page's content. The server page (page.tsx) loads the
 * devotional and its neighbours once and passes them in as plain data.
 */
export default function DevotionalView({
  devotional,
  prev,
  next,
}: {
  devotional: DevotionalViewData;
  prev: DevotionalLink | null;
  next: DevotionalLink | null;
}) {
  const formattedDate = new Date(devotional.scheduledAt).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );

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

  const devotionalUrl = `${SITE_URL}/devotionals/${devotional.id}`;
  const devotionalLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: devotional.title,
    datePublished: devotional.scheduledAt,
    dateModified: devotional.scheduledAt,
    inLanguage: "en",
    author: PUBLISHER,
    publisher: PUBLISHER,
    mainEntityOfPage: { "@type": "WebPage", "@id": devotionalUrl },
    url: devotionalUrl,
    ...(devotional.pdfUrl && {
      associatedMedia: {
        "@type": "MediaObject",
        contentUrl: devotional.pdfUrl,
        encodingFormat: "application/pdf",
      },
    }),
  };

  return (
    <div className="bg-gray-50/30 min-h-screen">
      <JsonLd data={devotionalLd} />
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
                    {/* Rendered on the page with PDF.js (falls back to Google's viewer). */}
                    <PdfViewer
                      src={devotional.pdfUrl}
                      title={devotional.title}
                    />

                    {/* Floating Expand Tool */}
                    {/* <div className="absolute top-6 right-6 flex items-center gap-3">
                      <a
                        href={devotional.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white shadow-xl text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-105"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Focus Mode
                      </a>
                    </div> */}
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
                <DevotionalSidebar currentId={devotional.id} />
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
    </div>
  );
}
