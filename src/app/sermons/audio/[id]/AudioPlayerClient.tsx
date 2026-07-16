"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Share2,
  Headphones,
  User,
  Calendar,
  Music,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Clock,
  Check,
  Link as LinkIcon,
  X,
  FastForward,
  RotateCcw,
  Repeat2,
  BrainCircuit,
  FileText,
} from "lucide-react";
import type { AudioSermon } from "@/lib/audioSermons";
import {
  getMediaProgress,
  clearMediaProgress,
  formatProgressTime,
} from "@/lib/mediaProgress";
import { parseSermonPart, findAdjacentParts } from "@/lib/sermonParts";
import {
  findTranscriptSlug,
  type TranscriptStub,
} from "@/utils/transcriptSlug";
import NextPartSuggestion from "@/components/media/NextPartSuggestion";
import {
  useGlobalAudio,
  useGlobalAudioProgress,
  type GlobalAudioTrack,
} from "@/components/providers/GlobalAudioProvider";

interface AudioPlayerClientProps {
  initialSermon: AudioSermon;
}

export default function AudioPlayerClient({
  initialSermon,
}: AudioPlayerClientProps) {
  const [sermon] = useState<AudioSermon>(initialSermon);

  const [copied, setCopied] = useState(false);

  // ── Playback is owned by GlobalAudioProvider ──────────────────────────────
  // The single <audio> element lives in the root layout, so playback survives
  // navigating away from this page (and the mobile mini-bar takes over). This
  // page keeps its own rich UI and simply reads/drives that element via context.
  const audio = useGlobalAudio();
  // This page IS the player — it renders a timeline and clock, so it genuinely
  // needs the ~4x/second position. Pages that only show a thin progress bar
  // should use <AudioProgressBar/> instead of subscribing here.
  const progress = useGlobalAudioProgress();
  const isCurrent = audio.isCurrent(sermon.id);
  const isPlaying = isCurrent && audio.isPlaying;
  const currentTime = isCurrent ? progress.currentTime : 0;
  const duration = isCurrent ? progress.duration : 0;
  const playbackRate = audio.playbackRate;
  const isMuted = audio.isMuted;
  const repeatMode = audio.repeatMode;

  const track = useMemo<GlobalAudioTrack>(
    () => ({
      id: sermon.id,
      title: sermon.title,
      speaker: sermon.speaker,
      series: sermon.series,
      thumbnailUrl: sermon.thumbnailUrl,
      src: sermon.downloadUrl || "",
      downloadUrl: sermon.downloadUrl,
      href: `/sermons/audio/${sermon.id}`,
    }),
    [sermon],
  );

  // ── Multi-part message suggestion (purely additive) ───────────────────────
  // Only ever populated when the title carries an explicit "Pt./Part N" marker.
  // For ordinary single-part messages this stays empty, so the end-of-playback
  // behaviour below is exactly what it was before.
  const [partSiblings, setPartSiblings] = useState<{
    previous: AudioSermon | null;
    next: AudioSermon | null;
    currentPart: number | null;
  }>({ previous: null, next: null, currentPart: null });
  const [showPartSuggestion, setShowPartSuggestion] = useState(false);

  // ── Matching transcript ───────────────────────────────────────────────────
  // The sermons list already matches audio messages to their transcripts; this
  // page didn't. Reuses the same tested matcher and the same cached endpoint,
  // which only serves the transcript categories (Sunday Message / Sunday School
  // / Bible Study / Other Meetings / Season of the Spirit) — Sunday School
  // *manuals* are a different category and are never matched here.
  const [transcriptStubs, setTranscriptStubs] = useState<TranscriptStub[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/wp/transcript-slugs", {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.items)) setTranscriptStubs(data.items);
      } catch {
        // Best-effort: no match simply means no transcript link is shown.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const matchedTranscriptSlug = useMemo(
    () => findTranscriptSlug(sermon.title, transcriptStubs, sermon.id),
    [sermon.title, sermon.id, transcriptStubs],
  );

  // Resolve the adjacent parts once, by searching the catalogue for the base
  // title and matching siblings that share it. Best-effort: any failure just
  // means no suggestion is offered.
  useEffect(() => {
    const info = parseSermonPart(sermon.title);
    if (!info) return; // not a multi-part message — nothing to do

    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          search: info.baseTitle,
          per_page: "25",
        });
        const res = await fetch(`/api/audio-sermons?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        const candidates: AudioSermon[] = Array.isArray(json?.data)
          ? json.data
          : [];
        const found = findAdjacentParts(
          sermon.title,
          candidates.filter((c) => c.id !== sermon.id),
        );
        if (!cancelled) setPartSiblings(found);
      } catch {
        // Suggestion is non-critical — fail silently.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sermon]);

  // The provider owns `onEnded` now, so it reports which track finished. When
  // it's this sermon and a sibling part exists, offer it. Messages without a
  // "Pt./Part N" marker leave partSiblings empty, so this stays a no-op.
  useEffect(() => {
    if (audio.endedTrackId !== sermon.id) return;
    if (partSiblings.next || partSiblings.previous) {
      setShowPartSuggestion(true);
    }
  }, [audio.endedTrackId, sermon.id, partSiblings]);

  // Resume prompt state
  const [resumePrompt, setResumePrompt] = useState<{
    currentTime: number;
    duration: number;
  } | null>(null);
  const [hasCheckedResume, setHasCheckedResume] = useState(false);

  // Check for saved progress on mount. The audio source is set by the provider
  // when playback starts — this page no longer owns an element. Progress saving
  // (interval + on pause + on unload) is likewise centralised in the provider.
  useEffect(() => {
    if (hasCheckedResume || !sermon) return;

    // If this sermon is already loaded in the global player, the user navigated
    // back to something that never stopped — prompting them to "resume" over
    // live playback would be wrong.
    if (isCurrent) {
      setHasCheckedResume(true);
      return;
    }

    const saved = getMediaProgress(sermon.id);
    if (saved && saved.currentTime >= 15) {
      setResumePrompt({
        currentTime: saved.currentTime,
        duration: saved.duration,
      });
    }
    setHasCheckedResume(true);
  }, [sermon, hasCheckedResume, isCurrent]);

  // Start playback from a specific time
  const startPlayback = useCallback(
    (startTime: number = 0) => {
      if (!sermon?.downloadUrl) return;
      audio.play(track, startTime);
    },
    [audio, track, sermon],
  );

  // Resume handlers
  const handleResume = useCallback(() => {
    if (!resumePrompt) return;
    startPlayback(resumePrompt.currentTime);
    setResumePrompt(null);
  }, [resumePrompt, startPlayback]);

  const handleStartOver = useCallback(() => {
    if (!sermon) return;
    clearMediaProgress(sermon.id);
    startPlayback(0);
    setResumePrompt(null);
  }, [sermon, startPlayback]);

  const handleDismissResume = useCallback(() => {
    setResumePrompt(null);
  }, []);

  const togglePlay = useCallback(() => {
    if (!sermon?.downloadUrl) return;
    // First press on this page (or after another message took over the player)
    // loads this sermon; afterwards it's a plain play/pause of the same element.
    if (!isCurrent) {
      audio.play(track, 0);
      return;
    }
    audio.toggle();
  }, [audio, track, isCurrent, sermon]);

  const toggleMute = useCallback(() => audio.toggleMute(), [audio]);

  const seek = useCallback(
    (seconds: number) => audio.seekBy(seconds),
    [audio],
  );

  const cycleSpeed = useCallback(() => audio.cycleSpeed(), [audio]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      audio.seekTo((x / rect.width) * duration);
    },
    [audio, duration],
  );

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const totalSeconds = Math.floor(time);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = sermon?.title || "Audio Message";

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [sermon]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      {/* The <audio> element now lives in GlobalAudioProvider (root layout) so
          playback continues when this page unmounts. Progress clearing and
          repeat-one are handled there too. */}

      {/* ===== NEXT/PREVIOUS PART SUGGESTION (multi-part messages only) ===== */}
      <NextPartSuggestion
        show={showPartSuggestion}
        onClose={() => setShowPartSuggestion(false)}
        currentPart={partSiblings.currentPart}
        previous={partSiblings.previous}
        next={partSiblings.next}
      />

      {/* ===== RESUME PLAYBACK PROMPT ===== */}
      <AnimatePresence>
        {resumePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleDismissResume}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary to-amber-500 p-6 text-white">
                <button
                  onClick={handleDismissResume}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
                      Resume Listening
                    </p>
                    <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2">
                      {sermon.title}
                    </h3>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-white/70 mb-1.5">
                    <span>
                      Listened:{" "}
                      {formatProgressTime(resumePrompt.currentTime)}
                    </span>
                    {resumePrompt.duration > 0 && (
                      <span>
                        Total:{" "}
                        {formatProgressTime(resumePrompt.duration)}
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${resumePrompt.duration > 0 ? (resumePrompt.currentTime / resumePrompt.duration) * 100 : 0}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 space-y-3">
                <button
                  onClick={handleResume}
                  className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                  id="resume-playback"
                >
                  <FastForward className="w-5 h-5" />
                  Continue from{" "}
                  {formatProgressTime(resumePrompt.currentTime)}
                </button>
                <button
                  onClick={handleStartOver}
                  className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
                  id="start-over"
                >
                  <RotateCcw className="w-5 h-5" />
                  Start Over
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex items-center justify-between">
          <Link
            href="/sermons"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">All Messages</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Only shown when this message actually has a matching transcript. */}
            {matchedTranscriptSlug && (
              <Link
                href={`/transcripts/${matchedTranscriptSlug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white text-sm font-medium transition-all"
                title="Read the transcript for this message"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Read Transcript</span>
                <span className="sm:hidden">Transcript</span>
              </Link>
            )}

            <Link
              href="/sermons/quiz"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-amber-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-primary/20 text-sm font-bold transition-all"
            >
              <BrainCircuit className="w-4 h-4" />
              <span className="hidden sm:inline">Take Quiz</span>
              <span className="sm:hidden">Quiz</span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white text-sm font-medium transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Album Art / Thumbnail */}
      <div className="flex items-center justify-center px-8 sm:px-12 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="relative w-full max-w-[360px] aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
        >
          {sermon.thumbnailUrl ? (
            <Image
              src={sermon.thumbnailUrl}
              alt={sermon.title}
              fill
              className="object-cover"
              sizes="360px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-amber-500/20 to-primary/10 flex items-center justify-center">
              <Headphones className="w-28 h-28 text-white/20" />
            </div>
          )}

          {/* Playing animation overlay */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-5 right-5 flex items-end gap-1.5 h-8"
              >
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-primary rounded-full"
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
        </motion.div>
      </div>

      {/* Song Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-xl mx-auto px-6 sm:px-8 text-center"
      >
        <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-bold leading-snug mb-3">
          {sermon.title}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-white/50 text-sm">
          {sermon.speaker && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary/70" />
              {sermon.speaker}
            </span>
          )}
          {sermon.date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary/70" />
              {sermon.date}
            </span>
          )}
          {sermon.series && (
            <span className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-primary/70" />
              {sermon.series}
            </span>
          )}
          {sermon.duration && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary/70" />
              {sermon.duration}
            </span>
          )}
        </div>
      </motion.div>

      {/* Player Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="max-w-xl mx-auto px-6 sm:px-8 mt-8 sm:mt-10"
      >
        {/* Progress Bar */}
        <div
          className="h-2 bg-white/10 rounded-full cursor-pointer group relative"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full relative transition-all duration-100"
            style={{
              width: `${duration ? (currentTime / duration) * 100 : 0}%`,
            }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-white/40 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 sm:gap-8 mt-6">
          <button
            onClick={() => seek(-15)}
            className="text-white/60 hover:text-white transition-colors p-2"
            aria-label="Rewind 15 seconds"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-r from-primary to-amber-500 flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>

          <button
            onClick={() => seek(15)}
            className="text-white/60 hover:text-white transition-colors p-2"
            aria-label="Forward 15 seconds"
          >
            <SkipForward className="w-7 h-7" />
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-center gap-4 mt-6 pb-8">
          {/* Repeat */}
          <button
            onClick={audio.toggleRepeat}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 relative ${
              repeatMode === "one"
                ? "bg-primary/20 text-primary"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
            }`}
            aria-label={repeatMode === "one" ? "Disable repeat" : "Repeat this message"}
            title={repeatMode === "one" ? "Repeat on" : "Repeat off"}
          >
            <Repeat2 className="w-5 h-5" />
            {repeatMode === "one" && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-white text-[8px] font-black flex items-center justify-center">1</span>
            )}
          </button>

          <button
            onClick={cycleSpeed}
            className="flex items-center justify-center px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm font-bold transition-all hover:bg-white/20 active:scale-95 min-w-[52px]"
            aria-label={`Playback speed ${playbackRate}x`}
          >
            {playbackRate}x
          </button>

          <button
            onClick={toggleMute}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all active:scale-95"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {sermon.downloadUrl && (
            <a
              href={sermon.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all active:scale-95"
              aria-label="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          )}

          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all active:scale-95"
            aria-label="Copy link"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <LinkIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
