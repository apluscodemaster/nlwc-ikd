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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-8 z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white shrink-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">
                  Transcript
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 line-clamp-2">
                  {title}
                </h2>
                {speaker && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {speaker}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close transcript"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-red-600 font-medium mb-4">{error}</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Visit the transcripts page for more options
                  </p>
                  <Link
                    href="/transcripts"
                    className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                  >
                    View All Transcripts
                  </Link>
                </div>
              ) : transcript ? (
                <div className="w-full">
                  <TranscriptContent content={transcript.content} />
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 p-6 sm:p-8 border-t border-gray-100 bg-gray-50">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Press{" "}
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono">
                  ESC
                </kbd>{" "}
                to close
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <a
                  href={`/transcripts/${slug}`}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
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
