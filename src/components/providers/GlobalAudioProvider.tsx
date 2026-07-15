"use client";

/**
 * GlobalAudioProvider — persistent audio playback across route changes.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every existing player owns its own <audio> element inside a page component.
 * Next unmounts the page on client-side navigation, which destroys the element
 * and stops playback. The ONLY way to keep audio alive across navigation is to
 * host the element somewhere that never unmounts — the root layout. This
 * provider is mounted there (via <Providers>), owns exactly one <audio>, and
 * exposes it through context.
 *
 * NON-INVASIVE BY DESIGN
 * ----------------------
 * Nothing plays until some surface calls `play()`. With no track, the provider
 * renders only an empty <audio> and no UI, so every page that hasn't opted in
 * behaves exactly as before. Entry points can migrate one at a time.
 *
 * CRITICAL INVARIANT
 * ------------------
 * The <audio> element is rendered UNCONDITIONALLY and never recreated — we only
 * swap `src`. On iOS, playback is authorised by the user gesture that started
 * it; remounting or recreating the element loses that authorisation and resume
 * fails silently.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  saveMediaProgress,
  clearMediaProgress,
} from "@/lib/mediaProgress";
import MobileFullPlayer from "@/components/media/MobileFullPlayer";
import GlobalAudioBar from "@/components/media/GlobalAudioBar";

export interface GlobalAudioTrack {
  id: number | string;
  title: string;
  speaker?: string;
  series?: string;
  thumbnailUrl?: string;
  /** The audio source URL (S3 mp3). */
  src: string;
  /** Optional direct download URL surfaced in the full player. */
  downloadUrl?: string;
}

interface GlobalAudioContextValue {
  track: GlobalAudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isMuted: boolean;
  repeatMode: "off" | "one";
  /** True when a track is loaded (the bar is showing). */
  isActive: boolean;
  isCurrent: (id: number | string) => boolean;
  play: (track: GlobalAudioTrack, startTime?: number) => void;
  toggle: () => void;
  pause: () => void;
  seekBy: (seconds: number) => void;
  seekTo: (seconds: number) => void;
  toggleMute: () => void;
  cycleSpeed: () => void;
  toggleRepeat: () => void;
  close: () => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextValue | null>(null);

/** Access the global player. Returns null outside the provider. */
export function useGlobalAudio(): GlobalAudioContextValue {
  const ctx = useContext(GlobalAudioContext);
  if (!ctx) {
    throw new Error("useGlobalAudio must be used within <GlobalAudioProvider>");
  }
  return ctx;
}

const SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.75] as const;

export default function GlobalAudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [track, setTrack] = useState<GlobalAudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one">("off");
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  const trackRef = useRef<GlobalAudioTrack | null>(null);
  trackRef.current = track;

  // ── Actions ───────────────────────────────────────────────────────────────
  const play = useCallback((next: GlobalAudioTrack, startTime = 0) => {
    const el = audioRef.current;
    if (!el || !next.src) return;

    const isSame = trackRef.current?.id === next.id;
    setTrack(next);

    if (!isSame) {
      // Only swap the source — never recreate the element (iOS gesture).
      el.src = next.src;
      el.currentTime = startTime;
    } else if (startTime > 0) {
      el.currentTime = startTime;
    }
    void el.play().catch(() => {
      // Autoplay blocked (no gesture) — surface as paused rather than throwing.
      setIsPlaying(false);
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !trackRef.current) return;
    if (el.paused) void el.play().catch(() => setIsPlaying(false));
    else el.pause();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, seconds));
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(
      0,
      Math.min(el.duration || 0, el.currentTime + seconds),
    );
  }, []);

  const toggleMute = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }, []);

  const cycleSpeed = useCallback(() => {
    setPlaybackRate((prev) => {
      const idx = SPEEDS.indexOf(prev as (typeof SPEEDS)[number]);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((r) => (r === "off" ? "one" : "off"));
  }, []);

  const close = useCallback(() => {
    const el = audioRef.current;
    const current = trackRef.current;
    if (el && current && el.currentTime > 0) {
      saveMediaProgress(
        current.id,
        el.currentTime,
        el.duration || 0,
        current.title,
        "audio",
      );
    }
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setTrack(null);
    setIsPlaying(false);
    setShowFullPlayer(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const isCurrent = useCallback(
    (id: number | string) => trackRef.current?.id === id,
    [],
  );

  // ── Keep the element's rate/mute in sync with state ───────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate, track]);

  // ── Periodic progress saving while playing ────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !track) return;
    const id = setInterval(() => {
      const el = audioRef.current;
      if (el && trackRef.current) {
        saveMediaProgress(
          trackRef.current.id,
          el.currentTime,
          el.duration || 0,
          trackRef.current.title,
          "audio",
        );
      }
    }, 5000);
    return () => clearInterval(id);
  }, [isPlaying, track]);

  // ── Save on unload (hard navigation / tab close destroys the element) ─────
  useEffect(() => {
    const onUnload = () => {
      const el = audioRef.current;
      if (el && trackRef.current && el.currentTime > 0) {
        saveMediaProgress(
          trackRef.current.id,
          el.currentTime,
          el.duration || 0,
          trackRef.current.title,
          "audio",
        );
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // ── Media Session: lock-screen / notification controls ────────────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    if (!track) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.speaker || "NLWC Ikorodu",
        album: track.series || "Sermons",
        artwork: track.thumbnailUrl
          ? [{ src: track.thumbnailUrl, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
    } catch {
      // MediaMetadata unsupported — controls simply won't show artwork.
    }
  }, [track]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void audioRef.current?.play()],
      ["pause", () => audioRef.current?.pause()],
      ["seekbackward", () => seekBy(-15)],
      ["seekforward", () => seekBy(15)],
      [
        "seekto",
        (details) => {
          if (details.seekTime != null) seekTo(details.seekTime);
        },
      ],
    ];
    for (const [action, handler] of handlers) {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // Unsupported action on this browser — ignore.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          ms.setActionHandler(action, null);
        } catch {
          /* ignore */
        }
      }
    };
  }, [seekBy, seekTo]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  const value = useMemo<GlobalAudioContextValue>(
    () => ({
      track,
      isPlaying,
      currentTime,
      duration,
      playbackRate,
      isMuted,
      repeatMode,
      isActive: !!track,
      isCurrent,
      play,
      toggle,
      pause,
      seekBy,
      seekTo,
      toggleMute,
      cycleSpeed,
      toggleRepeat,
      close,
      openFullPlayer: () => setShowFullPlayer(true),
      closeFullPlayer: () => setShowFullPlayer(false),
    }),
    [
      track,
      isPlaying,
      currentTime,
      duration,
      playbackRate,
      isMuted,
      repeatMode,
      isCurrent,
      play,
      toggle,
      pause,
      seekBy,
      seekTo,
      toggleMute,
      cycleSpeed,
      toggleRepeat,
      close,
    ],
  );

  // The bar is mobile-only and never shows over the admin console.
  const showBar =
    !!track && isMobile && !pathname?.startsWith("/admin");

  // Keep fixed-bar height clear of page content (and the footer).
  useEffect(() => {
    if (!showBar) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "calc(4.5rem + env(safe-area-inset-bottom))";
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, [showBar]);

  return (
    <GlobalAudioContext.Provider value={value}>
      {children}

      {/*
        Rendered unconditionally and never keyed/remounted — see the CRITICAL
        INVARIANT note at the top of this file.
      */}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          const el = audioRef.current;
          if (el && trackRef.current && el.currentTime > 0) {
            saveMediaProgress(
              trackRef.current.id,
              el.currentTime,
              el.duration || 0,
              trackRef.current.title,
              "audio",
            );
          }
        }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => {
          const el = audioRef.current;
          if (trackRef.current) clearMediaProgress(trackRef.current.id);
          if (repeatMode === "one" && el) {
            el.currentTime = 0;
            void el.play();
            return;
          }
          setIsPlaying(false);
        }}
      />

      {showBar && track && (
        <GlobalAudioBar
          title={track.title}
          speaker={track.speaker}
          thumbnailUrl={track.thumbnailUrl}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onToggle={toggle}
          onExpand={() => setShowFullPlayer(true)}
          onClose={close}
        />
      )}

      {track && (
        <MobileFullPlayer
          show={showFullPlayer && isMobile}
          onClose={() => setShowFullPlayer(false)}
          onClosePlayer={close}
          title={track.title}
          speaker={track.speaker}
          series={track.series}
          thumbnailUrl={track.thumbnailUrl}
          downloadUrl={track.downloadUrl}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          isMuted={isMuted}
          onTogglePlay={toggle}
          onSeek={seekBy}
          onToggleMute={toggleMute}
          onCycleSpeed={cycleSpeed}
          onProgressClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (duration) seekTo(pct * duration);
          }}
          repeatMode={repeatMode}
          onToggleRepeat={toggleRepeat}
        />
      )}
    </GlobalAudioContext.Provider>
  );
}
