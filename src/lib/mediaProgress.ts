// Media Playback Progress Persistence (localStorage)
// Shared utility for saving and retrieving playback progress across components

export interface MediaProgress {
  mediaId: string | number;
  currentTime: number;
  duration: number;
  title: string;
  timestamp: number; // Date.now() when saved
  type: "audio" | "video"; // Track media type
}

const PROGRESS_KEY_PREFIX = "nlwc-media-progress-";
const PROGRESS_INDEX_KEY = "nlwc-media-progress-index";
const PROGRESS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PROGRESS_MIN_SECONDS = 15; // Don't save if less than 15s played
const PROGRESS_NEAR_END_SECONDS = 30; // Consider finished if within 30s of end

export function saveMediaProgress(
  mediaId: string | number,
  currentTime: number,
  duration: number,
  title: string,
  type: "audio" | "video" = "audio",
) {
  if (typeof window === "undefined") return;

  // Don't save if barely started or near the end
  if (currentTime < PROGRESS_MIN_SECONDS) return;
  if (duration > 0 && duration - currentTime < PROGRESS_NEAR_END_SECONDS) {
    clearMediaProgress(mediaId);
    return;
  }

  const data: MediaProgress = {
    mediaId,
    currentTime,
    duration,
    title,
    timestamp: Date.now(),
    type,
  };

  try {
    localStorage.setItem(
      `${PROGRESS_KEY_PREFIX}${mediaId}`,
      JSON.stringify(data),
    );
    // Also maintain an index of saved IDs for cleanup
    const indexStr = localStorage.getItem(PROGRESS_INDEX_KEY);
    const index: (string | number)[] = indexStr ? JSON.parse(indexStr) : [];
    if (!index.includes(mediaId)) {
      index.push(mediaId);
      localStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(index));
    }
  } catch {
    // Storage full or not available — silently ignore
  }
}

export function getMediaProgress(mediaId: string | number): MediaProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const str = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${mediaId}`);
    if (!str) return null;
    const data: MediaProgress = JSON.parse(str);
    // Check age
    if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) {
      clearMediaProgress(mediaId);
      return null;
    }
    // Don't offer resume for very short progress
    if (data.currentTime < PROGRESS_MIN_SECONDS) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearMediaProgress(mediaId: string | number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${mediaId}`);
    const indexStr = localStorage.getItem(PROGRESS_INDEX_KEY);
    if (indexStr) {
      const index: (string | number)[] = JSON.parse(indexStr);
      const newIndex = index.filter((id) => id !== mediaId);
      localStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(newIndex));
    }
  } catch {
    // Ignore errors
  }
}

export function formatProgressTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
