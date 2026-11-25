/**
 * React Query setup: cache defaults, persistence to AsyncStorage (offline
 * reading of anything already opened), and wiring of React Query's online
 * and focus managers to NetInfo and AppState.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { ApiError } from "~/api/client";

const HOUR = 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * HOUR,
      retry: (failureCount, error) => {
        // Don't retry "not found" or validation errors.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "nlwc-query-cache",
  throttleTime: 2000,
});

/**
 * Bump to drop persisted caches whose shape changed (or that hold bad data).
 * v2: the live site's CDN had served one sermon for every /api/audio-sermons
 * request, so phones may have saved the wrong details for many sermons.
 */
export const PERSIST_BUSTER = "v2";
export const PERSIST_MAX_AGE = 7 * 24 * HOUR;

let wired = false;

export function wireQueryManagers(): void {
  if (wired) return;
  wired = true;

  // Offline only when there's no connection at all. NetInfo's
  // isInternetReachable probes a Google URL that some networks block; trusting
  // it paused every query even though the church API was reachable.
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    }),
  );

  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener("change", (status: AppStateStatus) => {
      if (Platform.OS !== "web") handleFocus(status === "active");
    });
    return () => sub.remove();
  });
}
