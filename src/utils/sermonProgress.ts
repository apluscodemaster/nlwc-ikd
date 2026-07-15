/**
 * Sermon playback progress — now a thin adapter over the shared media store.
 *
 * WHY
 * ---
 * This module used to own a SECOND localStorage store
 * ("nlwc-sermon-progress-<id>") while the sermon detail page, MediaHub and the
 * global player all used lib/mediaProgress ("nlwc-media-progress-<id>"). Progress
 * therefore never carried between the sermons list and the rest of the site:
 * resume worked "per page" instead of per message.
 *
 * Both now write to the single shared store. The public API here is unchanged so
 * existing callers don't need to move, and `getProgress()` transparently reads —
 * and migrates forward — any position saved under the old key, so nothing that
 * was already saved is lost.
 */

import type { AudioSermon } from "@/lib/audioSermons";
import {
  saveMediaProgress,
  getMediaProgress,
  clearMediaProgress,
  formatProgressTime as sharedFormatProgressTime,
  type MediaProgress,
} from "@/lib/mediaProgress";

export interface SavedProgress {
  sermonId: number;
  currentTime: number;
  duration: number;
  title: string;
  timestamp: number;
}

// ── Legacy store (read-only; drained on access) ─────────────────────────────
const LEGACY_KEY_PREFIX = "nlwc-sermon-progress-";
const LEGACY_INDEX_KEY = "nlwc-sermon-progress-index";
const PROGRESS_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const PROGRESS_MIN_SECONDS = 15;

function readLegacy(sermonId: number): SavedProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const str = localStorage.getItem(`${LEGACY_KEY_PREFIX}${sermonId}`);
    if (!str) return null;
    const data: SavedProgress = JSON.parse(str);
    if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) {
      removeLegacy(sermonId);
      return null;
    }
    if (data.currentTime < PROGRESS_MIN_SECONDS) return null;
    return data;
  } catch {
    return null;
  }
}

function removeLegacy(sermonId: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${LEGACY_KEY_PREFIX}${sermonId}`);
    const indexStr = localStorage.getItem(LEGACY_INDEX_KEY);
    if (indexStr) {
      const index: number[] = JSON.parse(indexStr);
      localStorage.setItem(
        LEGACY_INDEX_KEY,
        JSON.stringify(index.filter((id) => id !== sermonId)),
      );
    }
  } catch {
    // Storage unavailable — nothing to do.
  }
}

function toSaved(data: MediaProgress, sermonId: number): SavedProgress {
  return {
    sermonId,
    currentTime: data.currentTime,
    duration: data.duration,
    title: data.title,
    timestamp: data.timestamp,
  };
}

// ── Public API (unchanged signatures) ───────────────────────────────────────

export function saveProgress(sermon: AudioSermon, time: number, dur: number) {
  // The shared store applies the same min-seconds / near-end rules.
  saveMediaProgress(sermon.id, time, dur, sermon.title, "audio");
}

export function getProgress(sermonId: number): SavedProgress | null {
  const shared = getMediaProgress(sermonId);
  if (shared) return toSaved(shared, sermonId);

  // Nothing in the shared store — fall back to a position saved before the two
  // stores were unified, then migrate it forward so later reads hit the shared
  // store directly.
  const legacy = readLegacy(sermonId);
  if (!legacy) return null;
  saveMediaProgress(
    sermonId,
    legacy.currentTime,
    legacy.duration,
    legacy.title,
    "audio",
  );
  removeLegacy(sermonId);
  return legacy;
}

export function clearProgress(sermonId: number) {
  clearMediaProgress(sermonId);
  removeLegacy(sermonId);
}

export function cleanupOldProgress() {
  // Drop stale entries still sitting in the legacy store. Fresh ones migrate on
  // read via getProgress(); the shared store ages its own entries out.
  if (typeof window === "undefined") return;
  try {
    const indexStr = localStorage.getItem(LEGACY_INDEX_KEY);
    if (!indexStr) return;
    const index: number[] = JSON.parse(indexStr);
    for (const id of index) {
      const str = localStorage.getItem(`${LEGACY_KEY_PREFIX}${id}`);
      if (!str) {
        removeLegacy(id);
        continue;
      }
      const data: SavedProgress = JSON.parse(str);
      if (Date.now() - data.timestamp > PROGRESS_MAX_AGE_MS) removeLegacy(id);
    }
  } catch {
    // Silently ignore
  }
}

export const formatProgressTime = sharedFormatProgressTime;
