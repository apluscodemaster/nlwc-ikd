import type { AudioSermon } from "@/lib/audioSermons";

export interface SavedProgress {
  sermonId: number;
  currentTime: number;
  duration: number;
  title: string;
  timestamp: number;
}

const PROGRESS_KEY_PREFIX = "nlwc-sermon-progress-";
const PROGRESS_INDEX_KEY = "nlwc-sermon-progress-index";
const PROGRESS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const PROGRESS_MIN_SECONDS = 15;
const PROGRESS_NEAR_END_SECONDS = 30;

export function saveProgress(sermon: AudioSermon, time: number, dur: number) {
  if (typeof window === "undefined") return;
  if (time < PROGRESS_MIN_SECONDS) return;
  if (dur > 0 && dur - time < PROGRESS_NEAR_END_SECONDS) {
    clearProgress(sermon.id);
    return;
  }

  const data: SavedProgress = {
    sermonId: sermon.id,
    currentTime: time,
    duration: dur,
    title: sermon.title,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(
      `${PROGRESS_KEY_PREFIX}${sermon.id}`,
      JSON.stringify(data),
    );
    const indexStr = localStorage.getItem(PROGRESS_INDEX_KEY);
    const index: number[] = indexStr ? JSON.parse(indexStr) : [];
    if (!index.includes(sermon.id)) {
      index.push(sermon.id);
      localStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(index));
    }
  } catch {
    // Storage full or not available
  }
}

export function getProgress(sermonId: number): SavedProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const str = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${sermonId}`);
    if (!str) return null;
    const data: SavedProgress = JSON.parse(str);
    if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) {
      clearProgress(sermonId);
      return null;
    }
    if (data.currentTime < PROGRESS_MIN_SECONDS) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearProgress(sermonId: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${sermonId}`);
    const indexStr = localStorage.getItem(PROGRESS_INDEX_KEY);
    if (indexStr) {
      const index: number[] = JSON.parse(indexStr);
      const newIndex = index.filter((id) => id !== sermonId);
      localStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(newIndex));
    }
  } catch {
    // Silently ignore
  }
}

export function cleanupOldProgress() {
  if (typeof window === "undefined") return;
  try {
    const indexStr = localStorage.getItem(PROGRESS_INDEX_KEY);
    if (!indexStr) return;
    const index: number[] = JSON.parse(indexStr);
    for (const id of index) {
      const str = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${id}`);
      if (str) {
        const data: SavedProgress = JSON.parse(str);
        if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) {
          clearProgress(id);
        }
      } else {
        clearProgress(id);
      }
    }
  } catch {
    // Silently ignore
  }
}

export function formatProgressTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
