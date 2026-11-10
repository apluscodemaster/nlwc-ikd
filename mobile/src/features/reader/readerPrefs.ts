import { useCallback, useSyncExternalStore } from "react";
import { kv } from "~/lib/storage";

export type ReaderSurface = "default" | "sepia";

export interface ReaderPrefs {
  /** Body font size, 15–24 (DESIGN.md §2 `reader`). */
  fontSize: number;
  surface: ReaderSurface;
}

const KEY = "nlwc-reader-prefs";
const DEFAULTS: ReaderPrefs = { fontSize: 17, surface: "default" };
export const FONT_MIN = 14;
export const FONT_MAX = 24;

let current: ReaderPrefs = { ...DEFAULTS, ...(kv.getJSON<ReaderPrefs>(KEY) ?? {}) };
const listeners = new Set<() => void>();

function set(next: ReaderPrefs) {
  current = next;
  kv.setJSON(KEY, next);
  listeners.forEach((l) => l());
}

/** Reader text size and background, shared by every reader screen. */
export function useReaderPrefs() {
  const prefs = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  const setFontSize = useCallback(
    (size: number) => set({ ...current, fontSize: Math.min(FONT_MAX, Math.max(FONT_MIN, size)) }),
    [],
  );
  const setSurface = useCallback((surface: ReaderSurface) => set({ ...current, surface }), []);
  return { ...prefs, setFontSize, setSurface };
}
