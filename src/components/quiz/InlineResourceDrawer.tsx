"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Headphones,
} from "lucide-react";
import Image from "next/image";
import TranscriptContent from "@/components/shared/TranscriptContent";

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

function formatTime(time: number) {
  if (!time || isNaN(time)) return "0:00";
  const totalSeconds = Math.floor(time);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcriptHtml, setTranscriptHtml] = useState<string | null>(null);
  const [transcriptTitle, setTranscriptTitle] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const interactedRef = useRef(false);
  const transcriptScopeRef = useRef<HTMLDivElement>(null);

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
    setCurrentTime(0);
    setDuration(0);

    fetch(`/api/audio-sermons?message_id=${messageId}`)
      .then((res) => res.json())
      .then((data: AudioSermon) => setSermon(data))
      .catch(() => setSermon(null))
      .finally(() => setLoading(false));
  }, [open, href, variant]);

  // Fetch the transcript content (read variant) and render it directly, so the
  // drawer shows clean transcript text instead of the whole site page in an
  // iframe.
  useEffect(() => {
    if (!open || variant !== "read") return;

    const slug = href.match(/\/transcripts\/([^/?#]+)/)?.[1];
    if (!slug) return;

    setLoading(true);
    setTranscriptHtml(null);
    setTranscriptTitle(null);

    fetch(`/api/transcripts/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        setTranscriptHtml(json?.data?.content ?? null);
        setTranscriptTitle(json?.data?.title ?? null);
      })
      .catch(() => setTranscriptHtml(null))
      .finally(() => setLoading(false));
  }, [open, href, variant]);

  // Scripture references inside the transcript are highlighted by the scoped
  // ScriptureProvider that ScriptureContent carries internally, NOT Logos
  // RefTagger. RefTagger positions its popup in document space, which breaks
  // inside this fixed, independently-scrolling drawer; the in-app provider uses
  // a portal with viewport-relative `fixed` coordinates, so the verse tooltip
  // lands correctly here.

  // For "read" variant, count the resource as reviewed after 2 seconds.
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

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(
        audioRef.current.duration || 0,
        audioRef.current.currentTime + seconds,
      ),
    );
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      audioRef.current.currentTime = percentage * duration;
    },
    [duration],
  );

  const headerTitle =
    variant === "listen"
      ? (title ?? sermon?.title ?? "Listen")
      : (transcriptTitle ?? title ?? "Read Transcript");

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
            className="fixed bottom-0 left-0 right-0 z-60 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: "min(70vh, 640px)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {variant === "listen" && (
              <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-800 to-black">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white/80 truncate pr-2">
                    {headerTitle}
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Audio Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
                    </div>
                  )}

                  {!loading && !sermon && (
                    <p className="text-white/50 text-sm py-12">
                      Unable to load audio. Please try again.
                    </p>
                  )}

                  {!loading && sermon && (
                    <>
                      {/* Hidden audio element */}
                      <audio
                        ref={audioRef}
                        src={sermon.downloadUrl}
                        onTimeUpdate={() =>
                          setCurrentTime(
                            audioRef.current?.currentTime || 0,
                          )
                        }
                        onLoadedMetadata={() =>
                          setDuration(audioRef.current?.duration || 0)
                        }
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        preload="metadata"
                      />

                      {/* Thumbnail */}
                      <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 mb-5">
                        {sermon.thumbnailUrl ? (
                          <Image
                            src={sermon.thumbnailUrl}
                            alt={sermon.title}
                            fill
                            className="object-cover"
                            sizes="144px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-amber-500/20 to-primary/10 flex items-center justify-center">
                            <Headphones className="w-16 h-16 text-white/20" />
                          </div>
                        )}

                        {/* Playing animation overlay */}
                        <AnimatePresence>
                          {isPlaying && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute bottom-3 right-3 flex items-end gap-1 h-5"
                            >
                              {[0, 1, 2, 3].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 bg-primary rounded-full"
                                  animate={{
                                    height: ["30%", "100%", "50%", "80%", "30%"],
                                  }}
                                  transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                  }}
                                />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Song Info */}
                      <div className="text-center space-y-1 mb-5">
                        <p className="font-bold text-white text-base leading-snug line-clamp-2">
                          {sermon.title}
                        </p>
                        <p className="text-sm text-white/50">
                          {sermon.speaker}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full max-w-sm">
                        <div
                          className="h-1.5 bg-white/10 rounded-full cursor-pointer group relative"
                          onClick={handleProgressClick}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full relative transition-all duration-100"
                            style={{
                              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                            }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px] text-white/40 font-mono">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Main Controls */}
                      <div className="flex items-center justify-center gap-8 mt-5">
                        <button
                          onClick={() => seek(-15)}
                          className="text-white/60 hover:text-white transition-colors p-2 active:scale-90"
                          aria-label="Rewind 15 seconds"
                        >
                          <SkipBack className="w-6 h-6" />
                        </button>

                        <button
                          onClick={handlePlayPause}
                          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-amber-500 flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
                          aria-label={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? (
                            <Pause className="w-7 h-7" />
                          ) : (
                            <Play className="w-7 h-7 ml-0.5" />
                          )}
                        </button>

                        <button
                          onClick={() => seek(15)}
                          className="text-white/60 hover:text-white transition-colors p-2 active:scale-90"
                          aria-label="Forward 15 seconds"
                        >
                          <SkipForward className="w-6 h-6" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {variant === "read" && (
              <div className="flex flex-col h-full bg-card text-card-foreground">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
                  <h3 className="text-sm font-semibold text-foreground truncate pr-2">
                    {headerTitle}
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Transcript Content */}
                <div
                  ref={transcriptScopeRef}
                  className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
                    </div>
                  ) : transcriptHtml ? (
                    <TranscriptContent content={transcriptHtml} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                      <p className="text-sm text-muted-foreground">
                        Unable to load the transcript.
                      </p>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Open full transcript
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

