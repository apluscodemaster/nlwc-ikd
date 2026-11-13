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
export const FORCE_LIVE = __DEV__ && process.env.EXPO_PUBLIC_FORCE_LIVE === "1";

function read(): LiveStatus {
  const loaded = isScheduleLoaded();
  if (!loaded) return { loaded, isLive: false, currentTitle: "", next: null, secondsToNext: 0 };
  const now = new Date();
  if (FORCE_LIVE) {
    return { loaded, isLive: true, currentTitle: "Test service (forced live)", next: null, secondsToNext: 0 };
  }
  const isLive = isCurrentlyLive(now);
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
  const [status, setStatus] = useState<LiveStatus>(read);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      // Safe to call repeatedly: cached after the first success, backs off on failure.
      if (!isScheduleLoaded()) loadScheduleFromApi().then(() => setStatus(read()));
      setStatus(read());
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
