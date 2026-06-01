import { describe, it, expect } from "vitest";
import {
  TRANSCRIPT_TYPE_TO_CATEGORY,
  CATEGORY_TO_TRANSCRIPT_TYPE,
} from "@/components/admin/content/types";
import type { ContentType, TranscriptType } from "@/components/admin/content/types";

describe("admin content types", () => {
  describe("TRANSCRIPT_TYPE_TO_CATEGORY", () => {
    it("maps sunday-message to category 20", () => {
      expect(TRANSCRIPT_TYPE_TO_CATEGORY["sunday-message"]).toBe(20);
    });

    it("maps sunday-school to category 31", () => {
      expect(TRANSCRIPT_TYPE_TO_CATEGORY["sunday-school"]).toBe(31);
    });

    it("maps bible-study to category 33", () => {
      expect(TRANSCRIPT_TYPE_TO_CATEGORY["bible-study"]).toBe(33);
    });

    it("maps other-meetings to category 21", () => {
      expect(TRANSCRIPT_TYPE_TO_CATEGORY["other-meetings"]).toBe(21);
    });

    it("maps season-of-the-spirit to category 22", () => {
      expect(TRANSCRIPT_TYPE_TO_CATEGORY["season-of-the-spirit"]).toBe(22);
    });

    it("has exactly 5 transcript types", () => {
      expect(Object.keys(TRANSCRIPT_TYPE_TO_CATEGORY)).toHaveLength(5);
    });
  });

  describe("CATEGORY_TO_TRANSCRIPT_TYPE", () => {
    it("is the inverse of TRANSCRIPT_TYPE_TO_CATEGORY", () => {
      for (const [type, catId] of Object.entries(TRANSCRIPT_TYPE_TO_CATEGORY)) {
        expect(CATEGORY_TO_TRANSCRIPT_TYPE[catId]).toBe(type);
      }
    });

    it("has exactly 5 categories", () => {
      expect(Object.keys(CATEGORY_TO_TRANSCRIPT_TYPE)).toHaveLength(5);
    });
  });
});
