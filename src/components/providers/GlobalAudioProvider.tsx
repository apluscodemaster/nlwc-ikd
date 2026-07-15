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
import { usePathname, useRouter } from "next/navigation";
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
  /** Where the bar should navigate on desktop (mobile expands in place). */
  href?: string;
}

/**
 * Resolves a playable URL for a queued track that doesn't have one yet (sermon
 * listings don't carry `downloadUrl` until their detail is fetched). Supplied by
 * whichever surface owns the queue, so the fetching logic stays there.
 */
export type SrcResolver = (id: number | string) => Promise<string | null>;

interface GlobalAudioContextValue {
  track: GlobalAudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isMuted: boolean;
  repeatMode: "off" | "one";
  isShuffled: boolean;
  toggleShuffle: () => void;
  /**
   * Hand the provider the list to advance through when a track finishes. The
   * queue lives here (not in a page) so auto-play-next keeps working after the
   * listener navigates away from the list that started it.
   */
  setQueue: (tracks: GlobalAudioTrack[], resolveSrc?: SrcResolver) => void;
  /** True when a track is loaded (the bar is showing). */
  isActive: boolean;
  /**
   * Id of the track that most recently played to completion (cleared when
   * playback starts again). Surfaces can react to "my track finished" now that
   * the <audio> element — and therefore `onEnded` — lives here.
   */
  endedTrackId: number | string | null;
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
  const router = useRouter();
  const isMobile = useIsMobile();

  const [track, setTrack] = useState<GlobalAudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one">("off");
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [endedTrackId, setEndedTrackId] = useState<number | string | null>(null);

  const trackRef = useRef<GlobalAudioTrack | null>(null);
  trackRef.current = track;

  // ── Actions ───────────────────────────────────────────────────────────────
  const play = useCallback((next: GlobalAudioTrack, startTime = 0) => {
    const el = audioRef.current;
    if (!el || !next.src) return;

    const isSame = trackRef.current?.id === next.id;
    setTrack(next);
    setEndedTrackId(null);

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

  // ── Yield to any not-yet-migrated player ──────────────────────────────────
  // Other surfaces (sermons list, landing, quiz drawer, listen-live) still own
  // their own <audio>. Now that this one survives navigation, a user could start
  // one of those while this is still playing and hear both at once. Pause
  // ourselves whenever another media element starts. `play` doesn't bubble, so
  // this listens in the capture phase. Requires no changes to those surfaces.
  useEffect(() => {
    const onOtherPlay = (e: Event) => {
      const el = audioRef.current;
      if (!el || e.target === el) return;
      if (e.target instanceof HTMLMediaElement && !el.paused) {
        el.pause();
      }
    };
    document.addEventListener("play", onOtherPlay, true);
    return () => document.removeEventListener("play", onOtherPlay, true);
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
      endedTrackId,
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
      endedTrackId,
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

  // The bar shows at EVERY breakpoint. It was mobile-only at first, but since
  // audio now survives navigation, a desktop user would be left with audio
  // playing and no way to see or stop it. Persistent audio must always carry a
  // visible control. (Only the full-screen expansion stays mobile-only — on
  // desktop the bar navigates back to the message instead.)
  //
  // It is hidden over the admin console, and on the sermon detail route, since
  // that page IS a full player. It appears the moment you navigate away — which
  // is the whole point.
  const barHiddenHere =
    !!pathname &&
    (pathname.startsWith("/admin") || /^\/sermons\/audio\//.test(pathname));
  const showBar = !!track && !barHiddenHere;

  const handleExpand = useCallback(() => {
    if (isMobile) {
      setShowFullPlayer(true);
      return;
    }
    const href = trackRef.current?.href;
    if (href) router.push(href);
  }, [isMobile, router]);

  // Keep the fixed bar clear of page content (and the footer), and lift the
  // floating buttons above it. ScrollToTop and WhatsAppButton both position
  // themselves with `var(--scroll-bottom)`; the per-page players used to set it
  // and they no longer exist, so the provider owns it now.
  useEffect(() => {
    if (!showBar) return;
    const body = document.body;
    const root = document.documentElement;
    const prevPadding = body.style.paddingBottom;
    body.style.paddingBottom = "calc(4.5rem + env(safe-area-inset-bottom))";
    root.style.setProperty("--scroll-bottom", "6rem");
    return () => {
      body.style.paddingBottom = prevPadding;
      root.style.removeProperty("--scroll-bottom");
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
          setEndedTrackId(trackRef.current?.id ?? null);
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
          onExpand={handleExpand}
          onClose={close}
          expandable={isMobile || !!track.href}
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
