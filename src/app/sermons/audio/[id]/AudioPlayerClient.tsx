"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import type { AudioSermon } from "@/lib/audioSermons";
import {
  saveMediaProgress,
  getMediaProgress,
  clearMediaProgress,
  formatProgressTime,
} from "@/lib/mediaProgress";

interface AudioPlayerClientProps {
  initialSermon: AudioSermon;
}

export default function AudioPlayerClient({
  initialSermon,
}: AudioPlayerClientProps) {
  const [sermon] = useState<AudioSermon>(initialSermon);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copied, setCopied] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one">("off");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Resume prompt state
  const [resumePrompt, setResumePrompt] = useState<{
    currentTime: number;
    duration: number;
  } | null>(null);
  const progressSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const [hasCheckedResume, setHasCheckedResume] = useState(false);

  // Load audio source and check for saved progress on mount
  useEffect(() => {
    if (sermon?.downloadUrl && audioRef.current) {
      audioRef.current.src = sermon.downloadUrl;
    }

    // Check for saved progress
    if (!hasCheckedResume && sermon) {
      const saved = getMediaProgress(sermon.id);
      if (saved && saved.currentTime >= 15) {
        setResumePrompt({
          currentTime: saved.currentTime,
          duration: saved.duration,
        });
      }
      setHasCheckedResume(true);
    }
  }, [sermon, hasCheckedResume]);

  // Save progress periodically while playing
  useEffect(() => {
    if (isPlaying && sermon) {
      progressSaveIntervalRef.current = setInterval(() => {
        if (audioRef.current && sermon) {
          saveMediaProgress(
            sermon.id,
            audioRef.current.currentTime,
            audioRef.current.duration || 0,
            sermon.title,
            "audio",
          );
        }
      }, 5000);
    } else {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
        progressSaveIntervalRef.current = null;
      }
    }

    return () => {
      if (progressSaveIntervalRef.current) {
        clearInterval(progressSaveIntervalRef.current);
      }
    };
  }, [isPlaying, sermon]);

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current && sermon && audioRef.current.currentTime > 0) {
        saveMediaProgress(
          sermon.id,
          audioRef.current.currentTime,
          audioRef.current.duration || 0,
          sermon.title,
          "audio",
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sermon]);

  // Start playback from a specific time
  const startPlayback = useCallback(
    (startTime: number = 0) => {
      if (!audioRef.current || !sermon?.downloadUrl) return;
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
      setIsPlaying(true);
    },
    [sermon],
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
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + seconds,
      ),
    );
  }, []);

  const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];
  const cycleSpeed = useCallback(() => {
    setPlaybackRate((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

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
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => {
          if (sermon) clearMediaProgress(sermon.id);

          // Repeat-one: replay the same sermon
          if (repeatMode === "one" && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
            return;
          }

          setIsPlaying(false);
        }}
        preload="metadata"
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
            All Messages
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white text-sm font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share
              </>
            )}
          </button>
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
            onClick={() => setRepeatMode((prev) => (prev === "off" ? "one" : "off"))}
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
