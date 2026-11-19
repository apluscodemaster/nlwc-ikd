import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { scheduleApi } from "~/api/schedule";
import {
  getCurrentMeetingTitle,
  getNextService,
  isCurrentlyLive,
  isScheduleLoaded,
  loadScheduleFromApi,
  type NextServiceInfo,
} from "~/shared";

export interface LiveStatus {
  loaded: boolean;
  isLive: boolean;
  /** Live only because of the grace period: the scheduled end has passed. */
  overtime: boolean;
  /** Title of the service running now (when live). */
  currentTitle: string;
  next: NextServiceInfo | null;
  /** Seconds until the next service starts. */
  secondsToNext: number;
}

/**
 * Development only: EXPO_PUBLIC_FORCE_LIVE=1 makes the Live screen behave as
 * if a service were on, to work on the stream/chat UI between services.
 * Always false in release builds (__DEV__ is false there), and chat sending is
 * blocked while it's on so test messages never reach the real chat.
 */
/**
 * Services often run past their scheduled end, so the app treats a service as
 * live for this long afterwards (the website switches off on the hour).
 */
export const LIVE_GRACE_MS = 45 * 60 * 1000;
const GRACE_STEP_MS = 5 * 60 * 1000;

/** Whether a service was scheduled at some point in the last LIVE_GRACE_MS. */
function inGracePeriod(now: Date): boolean {
  for (let back = GRACE_STEP_MS; back <= LIVE_GRACE_MS; back += GRACE_STEP_MS) {
    if (isCurrentlyLive(new Date(now.getTime() - back))) return true;
  }
  return false;
}

export const FORCE_LIVE = __DEV__ && process.env.EXPO_PUBLIC_FORCE_LIVE === "1";

/** Live state at `now` (exported for tests). */
export function readLiveStatus(now = new Date()): LiveStatus {
  const loaded = isScheduleLoaded();
  if (!loaded) return { loaded, isLive: false, overtime: false, currentTitle: "", next: null, secondsToNext: 0 };

  if (FORCE_LIVE) {
    return { loaded, isLive: true, overtime: false, currentTitle: "Test service (forced live)", next: null, secondsToNext: 0 };
  }
  const scheduled = isCurrentlyLive(now);
  const overtime = !scheduled && inGracePeriod(now);
  const isLive = scheduled || overtime;
  let next: NextServiceInfo | null = null;
  try {
    next = getNextService(now);
  } catch {
    next = null;
  }
  const valid = next && next.date instanceof Date && !Number.isNaN(next.date.getTime()) ? next : null;
  return {
    loaded,
    isLive,
    overtime,
    currentTitle: isLive ? getCurrentMeetingTitle(now) : "",
    next: valid,
    secondsToNext: valid ? Math.max(0, Math.round((valid.date.getTime() - now.getTime()) / 1000)) : 0,
  };
}

/**
 * Live state from the admin schedule, in Lagos time, using the website's own
 * liveSchedule module. Ticks every `intervalMs` (1 s for countdowns, slower
 * for banners) and pauses while the app is in the background.
 */
export function useLiveStatus(intervalMs = 1000): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>(() => readLiveStatus());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      // Safe to call repeatedly: cached after the first success, backs off on failure.
      if (!isScheduleLoaded()) loadScheduleFromApi().then(() => setStatus(readLiveStatus()));
      setStatus(readLiveStatus());
    };
    const start = () => {
      tick();
      timer = setInterval(tick, intervalMs);
    };
    const stop = () => timer && clearInterval(timer);
    start();
    const sub = AppState.addEventListener("change", (s) => {
      stop();
      if (s === "active") start();
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [intervalMs]);

  return status;
}

/** Raw schedule (for listing the week's services). */
export function useSchedule() {
  return useQuery({ queryKey: ["schedule"], queryFn: scheduleApi.get, staleTime: 5 * 60 * 1000 });
}
