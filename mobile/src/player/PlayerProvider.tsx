/**
 * Global audio player (port of the web's GlobalAudioProvider), backed by a
 * single expo-audio player for the whole app (docs/ARCHITECTURE.md §7.1).
 *
 * Two contexts so that screens that only need the controls don't re-render
 * on every position tick:
 *   usePlayer()        — current track + stable control functions
 *   usePlayerStatus()  — playing / position / duration (updates ~2×/s)
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { clearMediaProgress, getMediaProgress, saveMediaProgress } from "~/shared";
import type { PlayerStatus, Track } from "./types";

const SAVE_EVERY_MS = 5000;

interface PlayerContextValue {
  track: Track | null;
  /** Load and start a track. Resumes from saved progress unless `startAt` is given. */
  play: (track: Track, opts?: { startAt?: number }) => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setRate: (rate: number) => void;
  stop: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);
const StatusContext = createContext<PlayerStatus>({
  playing: false,
  buffering: false,
  position: 0,
  duration: 0,
  rate: 1,
});

/** Lock-screen metadata, when the installed expo-audio supports it. */
function setLockScreen(player: AudioPlayer, track: Track | null) {
  const p = player as AudioPlayer & {
    setActiveForLockScreen?: (
      active: boolean,
      metadata?: { title?: string; artist?: string; albumTitle?: string; artworkUrl?: string },
    ) => void;
  };
  try {
    if (!p.setActiveForLockScreen) return;
    if (track) {
      p.setActiveForLockScreen(true, {
        title: track.title,
        artist: track.artist,
        albumTitle: track.album ?? "NLWC Ikorodu",
        artworkUrl: track.artwork,
      });
    } else {
      p.setActiveForLockScreen(false);
    }
  } catch {
    /* lock-screen controls are a nicety; never break playback over them */
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const raw = useAudioPlayerStatus(player);
  const [track, setTrack] = useState<Track | null>(null);
  const [rate, setRateState] = useState(1);
  const trackRef = useRef<Track | null>(null);
  const pendingSeek = useRef<number | null>(null);
  const lastSave = useRef(0);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
      interruptionModeAndroid: "doNotMix",
    }).catch(() => {});
  }, []);

  const persist = useCallback(
    (force = false) => {
      const t = trackRef.current;
      if (!t || t.isLive) return;
      const now = Date.now();
      if (!force && now - lastSave.current < SAVE_EVERY_MS) return;
      lastSave.current = now;
      if (player.currentTime > 0) {
        saveMediaProgress(t.id, player.currentTime, player.duration || 0, t.title, "audio");
      }
    },
    [player],
  );

  // Save progress while playing; apply a pending resume seek once loaded.
  useEffect(() => {
    if (raw.isLoaded && pendingSeek.current != null) {
      const at = pendingSeek.current;
      pendingSeek.current = null;
      player.seekTo(at).catch(() => {});
    }
    if (raw.playing) persist();
    if (raw.didJustFinish && trackRef.current && !trackRef.current.isLive) {
      clearMediaProgress(trackRef.current.id);
    }
  }, [raw.isLoaded, raw.playing, raw.currentTime, raw.didJustFinish, persist, player]);

  const play = useCallback<PlayerContextValue["play"]>(
    (next, opts) => {
      const current = trackRef.current;
      if (current && current.id === next.id && current.url === next.url) {
        if (opts?.startAt != null) player.seekTo(opts.startAt).catch(() => {});
        player.play();
        return;
      }
      persist(true);
      trackRef.current = next;
      setTrack(next);
      const saved = next.isLive ? null : getMediaProgress(next.id);
      pendingSeek.current = opts?.startAt ?? (saved ? saved.currentTime : null);
      player.replace({ uri: next.url });
      player.setPlaybackRate(next.isLive ? 1 : rate);
      player.play();
      setLockScreen(player, next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [player, persist, rate],
  );

  const toggle = useCallback(() => {
    if (!trackRef.current) return;
    if (player.playing) {
      player.pause();
      persist(true);
    } else {
      player.play();
    }
    Haptics.selectionAsync().catch(() => {});
  }, [player, persist]);

  const seekTo = useCallback(
    (s: number) => {
      if (trackRef.current?.isLive) return;
      player.seekTo(Math.max(0, s)).catch(() => {});
    },
    [player],
  );

  const seekBy = useCallback(
    (d: number) => {
      if (trackRef.current?.isLive) return;
      const dur = player.duration || Number.POSITIVE_INFINITY;
      player.seekTo(Math.min(dur, Math.max(0, player.currentTime + d))).catch(() => {});
    },
    [player],
  );

  const setRate = useCallback(
    (r: number) => {
      setRateState(r);
      if (!trackRef.current?.isLive) player.setPlaybackRate(r);
    },
    [player],
  );

  const stop = useCallback(() => {
    persist(true);
    player.pause();
    setLockScreen(player, null);
    trackRef.current = null;
    setTrack(null);
  }, [player, persist]);

  const controls = useMemo<PlayerContextValue>(
    () => ({ track, play, toggle, seekTo, seekBy, setRate, stop }),
    [track, play, toggle, seekTo, seekBy, setRate, stop],
  );

  const status = useMemo<PlayerStatus>(
    () => ({
      playing: raw.playing,
      buffering: raw.isBuffering,
      position: raw.currentTime ?? 0,
      duration: Number.isFinite(raw.duration) ? raw.duration ?? 0 : 0,
      rate,
    }),
    [raw.playing, raw.isBuffering, raw.currentTime, raw.duration, rate],
  );

  return (
    <PlayerContext.Provider value={controls}>
      <StatusContext.Provider value={status}>{children}</StatusContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

export function usePlayerStatus(): PlayerStatus {
  return useContext(StatusContext);
}
