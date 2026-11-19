/**
 * Global audio player (port of the web's GlobalAudioProvider), backed by a
 * single expo-audio player for the whole app (docs/ARCHITECTURE.md §7.1).
 *
 * Two contexts so that screens that only need the controls don't re-render
 * on every position tick:
 *   usePlayer()        — current track, queue, modes + stable control functions
 *   usePlayerStatus()  — playing / position / duration (updates ~2×/s)
 *
 * Like the website, the queue lives here rather than in a screen, so
 * auto-play-next keeps working after the listener leaves the list (or the app
 * is in the background). Repeat-one wins over the queue; shuffle picks a
 * random other message from it.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { kv } from "~/lib/storage";
import { clearMediaProgress, getMediaProgress, saveMediaProgress } from "~/shared";
import type { PlayerStatus, Track } from "./types";

const SAVE_EVERY_MS = 5000;
const REPEAT_KEY = "nlwc-player-repeat";
const SHUFFLE_KEY = "nlwc-player-shuffle";
/** "Previous" restarts the current message when past this point (seconds). */
const RESTART_THRESHOLD = 5;

/** Resolves a playable URL for a queued track that doesn't have one yet. */
export type UrlResolver = (id: Track["id"]) => Promise<string | null>;

export interface PlayOptions {
  /** Start here instead of the saved position. */
  startAt?: number;
  /**
   * The list this track was played from. It becomes the queue for
   * auto-play-next. Omit it to keep the current queue.
   */
  queue?: Track[];
  /** Fetches URLs for queued tracks that have none (`url: ""`). */
  resolveUrl?: UrlResolver;
}

interface PlayerContextValue {
  track: Track | null;
  /** The message that plays when this one ends (null at the end of the queue,
   *  while shuffling, or on repeat). */
  upNext: Track | null;
  /** Whether "next" has anything to skip to. */
  canSkip: boolean;
  repeat: boolean;
  shuffle: boolean;
  /** Load and start a track. Resumes from saved progress unless `startAt` is given. */
  play: (track: Track, opts?: PlayOptions) => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
  setRate: (rate: number) => void;
  /** Skip to the next message in the queue. */
  next: () => void;
  /** Restart the message, or go to the previous one when near its start. */
  previous: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
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

/** Native looping for repeat-one (a plain property on the native player). */
function setLooping(player: AudioPlayer, loop: boolean) {
  player.loop = loop;
}

const sameId = (a: Track["id"], b: Track["id"]) => String(a) === String(b);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const raw = useAudioPlayerStatus(player);
  const [track, setTrack] = useState<Track | null>(null);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [rate, setRateState] = useState(1);
  const [repeat, setRepeat] = useState(() => kv.getString(REPEAT_KEY) === "1");
  const [shuffle, setShuffle] = useState(() => kv.getString(SHUFFLE_KEY) === "1");
  const trackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const resolverRef = useRef<UrlResolver | null>(null);
  const shuffleRef = useRef(shuffle);
  const pendingSeek = useRef<number | null>(null);
  const lastSave = useRef(0);
  /** Guards against handling the same "finished" event twice. */
  const handledFinish = useRef<Track["id"] | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
      interruptionModeAndroid: "doNotMix",
    }).catch(() => {});
  }, []);

  // Repeat-one is native looping, so it keeps working in the background.
  useEffect(() => {
    setLooping(player, repeat && !track?.isLive);
  }, [player, repeat, track]);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

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

  /** Load `next` into the player (the low-level half of play()). */
  const load = useCallback(
    (next: Track, startAt: number | null) => {
      persist(true);
      handledFinish.current = null;
      trackRef.current = next;
      setTrack(next);
      pendingSeek.current = startAt;
      player.replace({ uri: next.url });
      player.setPlaybackRate(next.isLive ? 1 : rate);
      player.play();
      setLockScreen(player, next);
    },
    [player, persist, rate],
  );

  const play = useCallback<PlayerContextValue["play"]>(
    (next, opts) => {
      if (opts?.queue) {
        queueRef.current = opts.queue;
        setQueueState(opts.queue);
        resolverRef.current = opts.resolveUrl ?? null;
      }
      const current = trackRef.current;
      if (current && sameId(current.id, next.id) && current.url === next.url) {
        // Replaying a message that already finished starts it over.
        const startAt = opts?.startAt ?? (handledFinish.current != null ? 0 : null);
        handledFinish.current = null;
        if (startAt != null) player.seekTo(startAt).catch(() => {});
        player.play();
        return;
      }
      const saved = next.isLive ? null : getMediaProgress(next.id);
      load(next, opts?.startAt ?? (saved ? saved.currentTime : null));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [player, load],
  );

  /** Plays a queued track, fetching its URL first if the listing lacked one. */
  const playQueued = useCallback(
    async (candidate: Track | undefined): Promise<boolean> => {
      if (!candidate) return false;
      let url = candidate.url;
      if (!url && resolverRef.current) url = (await resolverRef.current(candidate.id).catch(() => null)) ?? "";
      if (!url) return false;
      // Auto-advance starts at the beginning, as on the website.
      load({ ...candidate, url }, 0);
      return true;
    },
    [load],
  );

  /** The track after `fromId`: the next in the list, or a random other one when shuffling. */
  const pickNext = useCallback((fromId: Track["id"]): Track | undefined => {
    const q = queueRef.current;
    const index = q.findIndex((t) => sameId(t.id, fromId));
    // Played from somewhere else (e.g. its own page): don't hijack playback
    // with an unrelated list.
    if (index === -1) return undefined;
    if (shuffleRef.current) {
      const others = q.filter((t) => !sameId(t.id, fromId));
      return others.length ? others[Math.floor(Math.random() * others.length)] : undefined;
    }
    return q[index + 1];
  }, []);

  // Save progress while playing; apply a pending resume seek once loaded;
  // advance through the queue when a message finishes.
  useEffect(() => {
    if (raw.isLoaded && pendingSeek.current != null) {
      const at = pendingSeek.current;
      pendingSeek.current = null;
      player.seekTo(at).catch(() => {});
    }
    if (raw.playing) persist();
    const finished = trackRef.current;
    if (raw.didJustFinish && finished && !finished.isLive && handledFinish.current !== finished.id) {
      handledFinish.current = finished.id;
      clearMediaProgress(finished.id);
      void playQueued(pickNext(finished.id));
    }
  }, [raw.isLoaded, raw.playing, raw.currentTime, raw.didJustFinish, persist, player, playQueued, pickNext]);

  const toggle = useCallback(() => {
    if (!trackRef.current) return;
    if (player.playing) {
      player.pause();
      persist(true);
    } else {
      if (handledFinish.current != null) {
        // Finished with nothing queued after it: play starts it over.
        handledFinish.current = null;
        player.seekTo(0).catch(() => {});
      }
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

  const next = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    Haptics.selectionAsync().catch(() => {});
    void playQueued(pickNext(t.id));
  }, [playQueued, pickNext]);

  const previous = useCallback(() => {
    const t = trackRef.current;
    if (!t || t.isLive) return;
    Haptics.selectionAsync().catch(() => {});
    const q = queueRef.current;
    const i = q.findIndex((x) => sameId(x.id, t.id));
    if (player.currentTime > RESTART_THRESHOLD || i <= 0) {
      player.seekTo(0).catch(() => {});
      return;
    }
    void playQueued(q[i - 1]);
  }, [player, playQueued]);

  const toggleRepeat = useCallback(() => {
    setRepeat((r) => {
      kv.setString(REPEAT_KEY, r ? "0" : "1");
      return !r;
    });
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((s) => {
      kv.setString(SHUFFLE_KEY, s ? "0" : "1");
      return !s;
    });
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    persist(true);
    player.pause();
    setLockScreen(player, null);
    trackRef.current = null;
    setTrack(null);
  }, [player, persist]);

  // What the full player shows as "Up next" (computed from state, not refs).
  const index = track ? queue.findIndex((t) => sameId(t.id, track.id)) : -1;
  const inQueue = !!track && !track.isLive && index !== -1;
  const upNext = inQueue && !repeat && !shuffle ? (queue[index + 1] ?? null) : null;
  const canSkip = inQueue && (shuffle ? queue.length > 1 : index < queue.length - 1);

  const controls = useMemo<PlayerContextValue>(
    () => ({
      track,
      upNext,
      canSkip,
      repeat,
      shuffle,
      play,
      toggle,
      seekTo,
      seekBy,
      setRate,
      next,
      previous,
      toggleRepeat,
      toggleShuffle,
      stop,
    }),
    [
      track,
      upNext,
      canSkip,
      repeat,
      shuffle,
      play,
      toggle,
      seekTo,
      seekBy,
      setRate,
      next,
      previous,
      toggleRepeat,
      toggleShuffle,
      stop,
    ],
  );

  const status = useMemo<PlayerStatus>(
    () => ({
      playing: raw.playing,
      buffering: raw.isBuffering,
      position: raw.currentTime ?? 0,
      duration: Number.isFinite(raw.duration) ? (raw.duration ?? 0) : 0,
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
