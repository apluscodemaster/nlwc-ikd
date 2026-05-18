"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import TranscriptContent from "@/components/shared/TranscriptContent";
import { logError } from "@/lib/devLog";
import Link from "next/link";

interface TranscriptOverlayProps {
  isOpen: boolean;
  slug: string;
  title: string;
  speaker?: string;
  onClose: () => void;
}

interface TranscriptData {
  title: string;
  content: string;
  speaker?: string;
  date?: string;
  formattedDate?: string;
}

/**
 * Overlay modal for displaying matched sermon transcripts inline
 * instead of navigating to a separate detail page
 */
export default function TranscriptOverlay({
  isOpen,
  slug,
  title,
  speaker,
  onClose,
}: TranscriptOverlayProps) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transcript content when overlay opens
  useEffect(() => {
    if (!isOpen || !slug) {
      setTranscript(null);
      setError(null);
      return;
    }

    const fetchTranscript = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/transcripts/${slug}`);
        if (!res.ok) {
          throw new Error("Failed to fetch transcript");
        }
        const json = await res.json();
        setTranscript(json.data);
      } catch (err) {
        logError("Error fetching transcript:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load transcript. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranscript();
  }, [isOpen, slug]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal - Responsive Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-1 xs:inset-2 sm:inset-4 md:inset-8 z-50 flex flex-col bg-white rounded-lg xs:rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden w-full mx-auto max-h-[calc(100vh-0.5rem)] xs:max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] md:max-w-4xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 xs:gap-3 p-3 xs:p-4 sm:p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white shrink-0">
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-[10px] xs:text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-0.5 xs:mb-1">
                  Transcript
                </p>
                <h2 className="text-sm xs:text-base sm:text-xl md:text-2xl font-bold text-gray-900 line-clamp-2 break-words leading-tight xs:leading-normal">
                  {title}
                </h2>
                {speaker && (
                  <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground mt-0.5 xs:mt-1 truncate">
                    {speaker}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close transcript"
              >
                <X className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 xs:p-4 sm:p-6 md:p-8 relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-4 xs:py-6">
                  <p className="text-red-600 font-medium mb-2 xs:mb-3 text-xs xs:text-sm">
                    {error}
                  </p>
                  <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground mb-3 xs:mb-4">
                    Visit the transcripts page for more options
                  </p>
                  <Link
                    href="/transcripts"
                    className="px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-lg bg-primary text-white font-medium text-xs xs:text-sm hover:bg-primary/90 transition-colors"
                  >
                    View All Transcripts
                  </Link>
                </div>
              ) : transcript ? (
                <div className="w-full break-words overflow-x-hidden">
                  <TranscriptContent content={transcript.content} />
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 p-3 xs:p-4 sm:p-6 md:p-8 border-t border-gray-100 bg-gray-50 shrink-0">
              <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground order-2 xs:order-1 line-clamp-1">
                Press{" "}
                <kbd className="px-1 xs:px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] xs:text-xs font-mono">
                  ESC
                </kbd>{" "}
                to close
              </p>
              <div className="flex flex-col-reverse xs:flex-row gap-1.5 xs:gap-2 order-1 xs:order-2 w-full xs:w-auto">
                <button
                  onClick={onClose}
                  className="px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-lg border border-gray-200 text-gray-700 font-medium text-xs xs:text-sm hover:bg-gray-100 transition-colors flex-1 xs:flex-none"
                >
                  Close
                </button>
                <a
                  href={`/transcripts/${slug}`}
                  className="px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-lg bg-primary text-white font-medium text-xs xs:text-sm hover:bg-primary/90 transition-colors text-center flex-1 xs:flex-none"
                >
                  View Full Page
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
