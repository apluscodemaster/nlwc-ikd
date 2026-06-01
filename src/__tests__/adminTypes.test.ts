import { describe, it, expect } from "vitest";
import {
  DAY_NAMES,
  CATEGORIES,
  formatHour,
} from "@/components/admin/schedule/types";
import { DEFAULT_CATEGORIES } from "@/components/quiz/admin/types";

describe("admin schedule types", () => {
  describe("DAY_NAMES", () => {
    it("has 7 days", () => {
      expect(DAY_NAMES).toHaveLength(7);
    });

    it("starts with Sunday", () => {
      expect(DAY_NAMES[0]).toBe("Sunday");
    });

    it("ends with Saturday", () => {
      expect(DAY_NAMES[6]).toBe("Saturday");
    });
  });

  describe("CATEGORIES", () => {
    it("includes expected categories", () => {
      expect(CATEGORIES).toContain("Worship");
      expect(CATEGORIES).toContain("Prayer");
      expect(CATEGORIES).toContain("Study");
      expect(CATEGORIES).toContain("Special");
      expect(CATEGORIES).toContain("Conference");
      expect(CATEGORIES).toContain("Youth");
    });
  });

  describe("formatHour", () => {
    it("formats midnight (0) as 12:00 AM", () => {
      expect(formatHour(0)).toBe("12:00 AM");
    });

    it("formats 24 as 12:00 AM", () => {
      expect(formatHour(24)).toBe("12:00 AM");
    });

    it("formats noon (12) as 12:00 PM", () => {
      expect(formatHour(12)).toBe("12:00 PM");
    });

    it("formats morning hours correctly", () => {
      expect(formatHour(1)).toBe("1:00 AM");
      expect(formatHour(9)).toBe("9:00 AM");
      expect(formatHour(11)).toBe("11:00 AM");
    });

    it("formats afternoon hours correctly", () => {
      expect(formatHour(13)).toBe("1:00 PM");
      expect(formatHour(17)).toBe("5:00 PM");
      expect(formatHour(23)).toBe("11:00 PM");
    });
  });
});

describe("quiz admin types", () => {
  describe("DEFAULT_CATEGORIES", () => {
    it("has 5 default categories", () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(5);
    });

    it("includes expected quiz categories", () => {
      expect(DEFAULT_CATEGORIES).toContain("Sunday Message");
      expect(DEFAULT_CATEGORIES).toContain("Sunday School");
      expect(DEFAULT_CATEGORIES).toContain("Bible Study");
      expect(DEFAULT_CATEGORIES).toContain("Special Meeting");
      expect(DEFAULT_CATEGORIES).toContain("Season of the Spirit");
    });
  });
});
