import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  saveProgress,
  getProgress,
  clearProgress,
  cleanupOldProgress,
  formatProgressTime,
  PROGRESS_MIN_SECONDS,
} from "@/utils/sermonProgress";
import type { AudioSermon } from "@/lib/audioSermons";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: () => store,
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

const mockSermon: AudioSermon = {
  id: 42,
  title: "Test Sermon",
  speaker: "Pastor Test",
  date: "2025-01-01",
  listenUrl: "https://example.com/listen",
  downloadUrl: "https://example.com/download.mp3",
};

// sermonProgress is now a thin adapter over the SHARED media store, so saved
// positions carry between the sermons list and the rest of the site (they used
// to live in a separate "nlwc-sermon-progress-*" store, so resume worked
// per-page instead of per-message). These tests assert the same behavioural
// contract — min-seconds, near-end clearing, expiry, index upkeep — against the
// unified keys, plus the one-way migration of anything saved under the old ones.
const KEY = (id: number | string) => `nlwc-media-progress-${id}`;
const INDEX_KEY = "nlwc-media-progress-index";
const LEGACY_KEY = (id: number | string) => `nlwc-sermon-progress-${id}`;
const LEGACY_INDEX_KEY = "nlwc-sermon-progress-index";

describe("sermonProgress", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // formatProgressTime
  // ===========================================================================
  describe("formatProgressTime", () => {
    it("formats seconds-only time", () => {
      expect(formatProgressTime(45)).toBe("0:45");
    });

    it("formats minutes and seconds", () => {
      expect(formatProgressTime(125)).toBe("2:05");
    });

    it("formats hours, minutes, and seconds", () => {
      expect(formatProgressTime(3661)).toBe("1:01:01");
    });

    it("pads seconds correctly", () => {
      expect(formatProgressTime(60)).toBe("1:00");
    });

    it("handles zero", () => {
      expect(formatProgressTime(0)).toBe("0:00");
    });

    it("pads minutes when hours present", () => {
      expect(formatProgressTime(3605)).toBe("1:00:05");
    });
  });

  // ===========================================================================
  // PROGRESS_MIN_SECONDS
  // ===========================================================================
  describe("PROGRESS_MIN_SECONDS", () => {
    it("is 15 seconds", () => {
      expect(PROGRESS_MIN_SECONDS).toBe(15);
    });
  });

  // ===========================================================================
  // saveProgress
  // ===========================================================================
  describe("saveProgress", () => {
    it("saves progress to the shared media store", () => {
      saveProgress(mockSermon, 120, 3600);
      const stored = localStorageMock.getItem(KEY(mockSermon.id));
      expect(stored).not.toBeNull();
      const data = JSON.parse(stored!);
      expect(data.mediaId).toBe(42);
      expect(data.currentTime).toBe(120);
      expect(data.duration).toBe(3600);
      expect(data.title).toBe("Test Sermon");
      expect(data.type).toBe("audio");
    });

    it("writes where the rest of the site reads (no separate sermon store)", () => {
      saveProgress(mockSermon, 120, 3600);
      // The old per-page store must NOT be written any more — that split is
      // exactly what stopped resume carrying across pages.
      expect(localStorageMock.getItem(LEGACY_KEY(mockSermon.id))).toBeNull();
    });

    it("does not save if time is below minimum", () => {
      saveProgress(mockSermon, 5, 3600);
      expect(localStorageMock.getItem(KEY(mockSermon.id))).toBeNull();
    });

    it("clears progress when near the end", () => {
      saveProgress(mockSermon, 120, 3600);
      expect(localStorageMock.getItem(KEY(mockSermon.id))).not.toBeNull();

      // Now save near end (within 30 seconds of duration)
      saveProgress(mockSermon, 3580, 3600);
      expect(localStorageMock.getItem(KEY(mockSermon.id))).toBeNull();
    });

    it("adds sermon ID to the progress index", () => {
      saveProgress(mockSermon, 120, 3600);
      const indexStr = localStorageMock.getItem(INDEX_KEY);
      expect(indexStr).not.toBeNull();
      const index = JSON.parse(indexStr!);
      expect(index).toContain(42);
    });

    it("does not duplicate IDs in the index", () => {
      saveProgress(mockSermon, 120, 3600);
      saveProgress(mockSermon, 200, 3600);
      const indexStr = localStorageMock.getItem(INDEX_KEY);
      const index = JSON.parse(indexStr!);
      expect(index.filter((id: number) => id === 42)).toHaveLength(1);
    });
  });

  // ===========================================================================
  // Legacy migration — positions saved before the two stores were unified
  // ===========================================================================
  describe("legacy migration", () => {
    it("reads a position saved under the old key and migrates it forward", () => {
      const legacy = {
        sermonId: 42,
        currentTime: 300,
        duration: 3600,
        title: "Old Save",
        timestamp: Date.now(),
      };
      localStorageMock.setItem(LEGACY_KEY(42), JSON.stringify(legacy));
      localStorageMock.setItem(LEGACY_INDEX_KEY, JSON.stringify([42]));

      // Nothing is lost: the old position is still offered...
      const progress = getProgress(42);
      expect(progress).not.toBeNull();
      expect(progress!.currentTime).toBe(300);

      // ...and it now lives in the shared store, with the old copy drained.
      const migrated = localStorageMock.getItem(KEY(42));
      expect(migrated).not.toBeNull();
      expect(JSON.parse(migrated!).currentTime).toBe(300);
      expect(localStorageMock.getItem(LEGACY_KEY(42))).toBeNull();
    });

    it("prefers the shared store over a stale legacy copy", () => {
      saveProgress(mockSermon, 500, 3600);
      localStorageMock.setItem(
        LEGACY_KEY(42),
        JSON.stringify({
          sermonId: 42,
          currentTime: 20,
          duration: 3600,
          title: "Stale",
          timestamp: Date.now(),
        }),
      );
      expect(getProgress(42)!.currentTime).toBe(500);
    });
  });

  // ===========================================================================
  // getProgress
  // ===========================================================================
  describe("getProgress", () => {
    it("returns saved progress", () => {
      saveProgress(mockSermon, 300, 3600);
      const progress = getProgress(mockSermon.id);
      expect(progress).not.toBeNull();
      expect(progress!.currentTime).toBe(300);
      expect(progress!.sermonId).toBe(42);
    });

    it("returns null for unsaved sermon", () => {
      expect(getProgress(999)).toBeNull();
    });

    it("returns null for expired progress (>30 days)", () => {
      const expired = {
        mediaId: 42,
        currentTime: 300,
        duration: 3600,
        title: "Test",
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
        type: "audio",
      };
      localStorageMock.setItem(KEY(42), JSON.stringify(expired));
      expect(getProgress(42)).toBeNull();
    });

    it("returns null when currentTime is below minimum", () => {
      const lowProgress = {
        mediaId: 42,
        currentTime: 5,
        duration: 3600,
        title: "Test",
        timestamp: Date.now(),
        type: "audio",
      };
      localStorageMock.setItem(KEY(42), JSON.stringify(lowProgress));
      expect(getProgress(42)).toBeNull();
    });

    it("ignores an expired legacy position", () => {
      localStorageMock.setItem(
        LEGACY_KEY(42),
        JSON.stringify({
          sermonId: 42,
          currentTime: 300,
          duration: 3600,
          title: "Test",
          timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
        }),
      );
      expect(getProgress(42)).toBeNull();
    });
  });

  // ===========================================================================
  // clearProgress
  // ===========================================================================
  describe("clearProgress", () => {
    it("removes progress from localStorage", () => {
      saveProgress(mockSermon, 300, 3600);
      clearProgress(mockSermon.id);
      expect(localStorageMock.getItem(KEY(mockSermon.id))).toBeNull();
      expect(getProgress(mockSermon.id)).toBeNull();
    });

    it("removes sermon ID from the index", () => {
      saveProgress(mockSermon, 300, 3600);
      clearProgress(mockSermon.id);
      const indexStr = localStorageMock.getItem(INDEX_KEY);
      if (indexStr) {
        const index = JSON.parse(indexStr);
        expect(index).not.toContain(42);
      }
    });

    it("also drains any legacy copy, so it can't resurrect", () => {
      localStorageMock.setItem(
        LEGACY_KEY(42),
        JSON.stringify({
          sermonId: 42,
          currentTime: 300,
          duration: 3600,
          title: "Old",
          timestamp: Date.now(),
        }),
      );
      clearProgress(42);
      expect(localStorageMock.getItem(LEGACY_KEY(42))).toBeNull();
      expect(getProgress(42)).toBeNull();
    });
  });

  // ===========================================================================
  // cleanupOldProgress
  // ===========================================================================
  // cleanupOldProgress now only drains the LEGACY store — the shared store ages
  // its own entries out on read, and fresh legacy ones migrate via getProgress().
  describe("cleanupOldProgress", () => {
    it("removes expired legacy entries", () => {
      const expired = {
        sermonId: 100,
        currentTime: 300,
        duration: 3600,
        title: "Old Sermon",
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
      };
      localStorageMock.setItem(LEGACY_KEY(100), JSON.stringify(expired));
      localStorageMock.setItem(LEGACY_INDEX_KEY, JSON.stringify([100]));

      cleanupOldProgress();
      expect(localStorageMock.getItem(LEGACY_KEY(100))).toBeNull();
    });

    it("keeps non-expired progress entries", () => {
      saveProgress(mockSermon, 300, 3600);
      cleanupOldProgress();
      expect(localStorageMock.getItem(KEY(mockSermon.id))).not.toBeNull();
      expect(getProgress(mockSermon.id)).not.toBeNull();
    });

    it("keeps a non-expired legacy entry so it can still migrate", () => {
      localStorageMock.setItem(
        LEGACY_KEY(101),
        JSON.stringify({
          sermonId: 101,
          currentTime: 300,
          duration: 3600,
          title: "Recent",
          timestamp: Date.now(),
        }),
      );
      localStorageMock.setItem(LEGACY_INDEX_KEY, JSON.stringify([101]));
      cleanupOldProgress();
      expect(localStorageMock.getItem(LEGACY_KEY(101))).not.toBeNull();
    });

    it("handles missing index gracefully", () => {
      expect(() => cleanupOldProgress()).not.toThrow();
    });

    it("cleans up orphaned index entries (no matching data)", () => {
      localStorageMock.setItem(LEGACY_INDEX_KEY, JSON.stringify([999]));
      cleanupOldProgress();
      const indexStr = localStorageMock.getItem(LEGACY_INDEX_KEY);
      if (indexStr) {
        const index = JSON.parse(indexStr);
        expect(index).not.toContain(999);
      }
    });
  });
});
