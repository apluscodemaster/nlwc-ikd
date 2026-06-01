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
    it("saves progress to localStorage", () => {
      saveProgress(mockSermon, 120, 3600);
      const stored = localStorageMock.getItem(
        `nlwc-sermon-progress-${mockSermon.id}`,
      );
      expect(stored).not.toBeNull();
      const data = JSON.parse(stored!);
      expect(data.sermonId).toBe(42);
      expect(data.currentTime).toBe(120);
      expect(data.duration).toBe(3600);
      expect(data.title).toBe("Test Sermon");
    });

    it("does not save if time is below minimum", () => {
      saveProgress(mockSermon, 5, 3600);
      const stored = localStorageMock.getItem(
        `nlwc-sermon-progress-${mockSermon.id}`,
      );
      expect(stored).toBeNull();
    });

    it("clears progress when near the end", () => {
      // First save some progress
      saveProgress(mockSermon, 120, 3600);
      expect(
        localStorageMock.getItem(`nlwc-sermon-progress-${mockSermon.id}`),
      ).not.toBeNull();

      // Now save near end (within 30 seconds of duration)
      saveProgress(mockSermon, 3580, 3600);
      expect(
        localStorageMock.getItem(`nlwc-sermon-progress-${mockSermon.id}`),
      ).toBeNull();
    });

    it("adds sermon ID to the progress index", () => {
      saveProgress(mockSermon, 120, 3600);
      const indexStr = localStorageMock.getItem("nlwc-sermon-progress-index");
      expect(indexStr).not.toBeNull();
      const index = JSON.parse(indexStr!);
      expect(index).toContain(42);
    });

    it("does not duplicate IDs in the index", () => {
      saveProgress(mockSermon, 120, 3600);
      saveProgress(mockSermon, 200, 3600);
      const indexStr = localStorageMock.getItem("nlwc-sermon-progress-index");
      const index = JSON.parse(indexStr!);
      expect(index.filter((id: number) => id === 42)).toHaveLength(1);
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
      // Manually insert expired data
      const expired = {
        sermonId: 42,
        currentTime: 300,
        duration: 3600,
        title: "Test",
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
      };
      localStorageMock.setItem(
        `nlwc-sermon-progress-42`,
        JSON.stringify(expired),
      );
      expect(getProgress(42)).toBeNull();
    });

    it("returns null when currentTime is below minimum", () => {
      const lowProgress = {
        sermonId: 42,
        currentTime: 5,
        duration: 3600,
        title: "Test",
        timestamp: Date.now(),
      };
      localStorageMock.setItem(
        `nlwc-sermon-progress-42`,
        JSON.stringify(lowProgress),
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
      expect(
        localStorageMock.getItem(`nlwc-sermon-progress-${mockSermon.id}`),
      ).toBeNull();
    });

    it("removes sermon ID from the index", () => {
      saveProgress(mockSermon, 300, 3600);
      clearProgress(mockSermon.id);
      const indexStr = localStorageMock.getItem("nlwc-sermon-progress-index");
      if (indexStr) {
        const index = JSON.parse(indexStr);
        expect(index).not.toContain(42);
      }
    });
  });

  // ===========================================================================
  // cleanupOldProgress
  // ===========================================================================
  describe("cleanupOldProgress", () => {
    it("removes expired progress entries", () => {
      // Insert an expired entry manually
      const expired = {
        sermonId: 100,
        currentTime: 300,
        duration: 3600,
        title: "Old Sermon",
        timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000,
      };
      localStorageMock.setItem(
        "nlwc-sermon-progress-100",
        JSON.stringify(expired),
      );
      localStorageMock.setItem(
        "nlwc-sermon-progress-index",
        JSON.stringify([100]),
      );

      cleanupOldProgress();
      expect(localStorageMock.getItem("nlwc-sermon-progress-100")).toBeNull();
    });

    it("keeps non-expired progress entries", () => {
      saveProgress(mockSermon, 300, 3600);
      cleanupOldProgress();
      expect(
        localStorageMock.getItem(`nlwc-sermon-progress-${mockSermon.id}`),
      ).not.toBeNull();
    });

    it("handles missing index gracefully", () => {
      expect(() => cleanupOldProgress()).not.toThrow();
    });

    it("cleans up orphaned index entries (no matching data)", () => {
      localStorageMock.setItem(
        "nlwc-sermon-progress-index",
        JSON.stringify([999]),
      );
      cleanupOldProgress();
      // Orphaned entry should be removed from index
      const indexStr = localStorageMock.getItem("nlwc-sermon-progress-index");
      if (indexStr) {
        const index = JSON.parse(indexStr);
        expect(index).not.toContain(999);
      }
    });
  });
});
