"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface AudioSermon {
  id: number;
  title: string;
  speaker: string;
  date: string;
  downloadUrl: string;
  thumbnailUrl: string;
  series: string;
  duration: number;
}

interface InlineResourceDrawerProps {
  open: boolean;
  onClose: () => void;
  href: string;
  variant: "listen" | "read";
  title?: string;
  onInteracted?: () => void;
}

export function InlineResourceDrawer({
  open,
  onClose,
  href,
  variant,
  title,
  onInteracted,
}: InlineResourceDrawerProps) {
  const [sermon, setSermon] = useState<AudioSermon | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const interactedRef = useRef(false);

  // Reset interacted flag when drawer opens with new content
  useEffect(() => {
    if (open) {
      interactedRef.current = false;
    }
  }, [open, href]);

  // Fetch audio sermon data when variant is "listen"
  useEffect(() => {
    if (!open || variant !== "listen") return;

    const match = href.match(/\/sermons\/audio\/(\d+)/);
    if (!match) return;

    const messageId = match[1];
    setLoading(true);
    setSermon(null);

    fetch(`/api/audio-sermons?message_id=${messageId}`)
      .then((res) => res.json())
      .then((data: AudioSermon) => setSermon(data))
      .catch(() => setSermon(null))
      .finally(() => setLoading(false));
  }, [open, href, variant]);

  // For "read" variant, fire onInteracted after 2 seconds
  useEffect(() => {
    if (!open || variant !== "read") return;

    const timer = setTimeout(() => {
      if (!interactedRef.current) {
        interactedRef.current = true;
        onInteracted?.();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [open, variant, onInteracted]);

  // Clean up audio on close
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [open]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);

      if (!interactedRef.current) {
        interactedRef.current = true;
        onInteracted?.();
      }
    }
  }, [isPlaying, onInteracted]);

  const headerTitle =
    variant === "listen"
      ? title ?? sermon?.title ?? "Listen"
      : title ?? "Read Transcript";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl"
            style={{ height: "70vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 truncate pr-2">
                {headerTitle}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto" style={{ height: "calc(70vh - 53px)" }}>
              {variant === "listen" && (
                <div className="p-4 flex flex-col items-center gap-4">
                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                  )}

                  {!loading && !sermon && (
                    <p className="text-gray-500 text-sm py-12">
                      Unable to load audio. Please try again.
                    </p>
                  )}

                  {!loading && sermon && (
                    <>
                      {sermon.thumbnailUrl && (
                        <img
                          src={sermon.thumbnailUrl}
                          alt={sermon.title}
                          className="w-32 h-32 rounded-xl object-cover shadow-md"
                        />
                      )}

                      <div className="text-center space-y-1">
                        <p className="font-semibold text-gray-900">
                          {sermon.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {sermon.speaker}
                        </p>
                        {sermon.series && (
                          <p className="text-xs text-gray-400">
                            {sermon.series}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handlePlayPause}
                        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-lg"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6"
                          >
                            <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-6 h-6"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>

                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <audio
                        ref={audioRef}
                        src={sermon.downloadUrl}
                        controls
                        className="w-full max-w-sm"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </>
                  )}
                </div>
              )}

              {variant === "read" && (
                <iframe
                  src={href}
                  title={headerTitle}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
