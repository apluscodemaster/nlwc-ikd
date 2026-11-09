/**
 * Local storage for the app.
 *
 * `expo-sqlite/localStorage/install` (imported first in app/_layout.tsx)
 * installs a synchronous, persistent `globalThis.localStorage`. That lets web
 * modules such as lib/mediaProgress and lib/quizMastery run unchanged, and
 * gives the app a simple synchronous key-value store (`kv`) for preferences.
 *
 * Secrets (the quiz session id) go in SecureStore instead: see `secure`.
 */
import * as SecureStore from "expo-secure-store";

function ls(): Storage | undefined {
  return typeof globalThis.localStorage === "undefined" ? undefined : globalThis.localStorage;
}

export const kv = {
  getString(key: string): string | null {
    try {
      return ls()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setString(key: string, value: string): void {
    try {
      ls()?.setItem(key, value);
    } catch {
      /* storage full or unavailable: preferences are best-effort */
    }
  },
  getJSON<T>(key: string): T | null {
    const raw = kv.getString(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJSON(key: string, value: unknown): void {
    kv.setString(key, JSON.stringify(value));
  },
  remove(key: string): void {
    try {
      ls()?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const secure = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
