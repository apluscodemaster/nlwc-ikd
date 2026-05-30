"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Play, Pause } from "lucide-react";
import Image from "next/image";

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
      ? (title ?? sermon?.title ?? "Listen")
      : (title ?? "Read Transcript");
  const transcriptTopOffsetPx = 200;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-60 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-60 bg-card text-card-foreground rounded-t-3xl border-t border-border shadow-2xl flex flex-col"
            style={{ height: "min(70vh, 640px)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
              <h3 className="text-sm font-semibold text-foreground truncate pr-2">
                {headerTitle}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible-ring"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
              {variant === "listen" && (
                <div className="p-4 flex flex-col items-center gap-4">
                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    </div>
                  )}

                  {!loading && !sermon && (
                    <p className="text-muted-foreground text-sm py-12">
                      Unable to load audio. Please try again.
                    </p>
                  )}

                  {!loading && sermon && (
                    <>
                      {sermon.thumbnailUrl && (
                        <Image
                          src={sermon.thumbnailUrl}
                          alt={sermon.title}
                          width={128}
                          height={128}
                          className="w-32 h-32 rounded-xl object-cover shadow-md"
                        />
                      )}

                      <div className="text-center space-y-1">
                        <p className="font-semibold text-foreground">
                          {sermon.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sermon.speaker}
                        </p>
                        {sermon.series && (
                          <p className="text-xs text-muted-foreground/80">
                            {sermon.series}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handlePlayPause}
                        className="w-14 h-14 rounded-full bg-[#ff7c18] hover:bg-[#e86f14] text-white flex items-center justify-center transition-colors shadow-lg shadow-[0_14px_28px_-14px_rgba(255,124,24,0.85)]"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-0.5" />
                        )}
                      </button>

                      <audio
                        ref={audioRef}
                        src={sermon.downloadUrl}
                        controls
                        className="w-full max-w-sm accent-[#ff7c18]"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </>
                  )}
                </div>
              )}

              {variant === "read" && (
                <div className="w-full h-full overflow-hidden relative">
                  {/* Mask sticky site chrome (logo / hamburger) while keeping transcript body visible */}
                  <div className="pointer-events-none absolute top-0 left-0 right-0 h-14 sm:h-16 z-10 bg-card border-b border-border" />
                  {/* Offset the iframe to hide the site header/nav */}
                  <iframe
                    src={href}
                    title={headerTitle}
                    className="w-full border-0 absolute top-0 left-0"
                    style={{
                      height: `calc(100% + ${transcriptTopOffsetPx}px)`,
                      marginTop: `-${transcriptTopOffsetPx}px`,
                    }}
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
