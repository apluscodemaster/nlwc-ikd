import { describe, expect, it } from "vitest";
import { latestImages, type DateColumns } from "@/lib/sheets";

const day = (date: string, images: string[]): DateColumns => ({ date, images });

describe("latestImages", () => {
  const dates = [day("2026-01-04", ["a1", "a2"]), day("2026-10-11", ["b1", "b2", "b3"]), day("2026-11-15", ["c1", "c2"])];

  it("takes the newest date's photos first, then earlier dates", () => {
    expect(latestImages(dates, 4)).toEqual(["c1", "c2", "b1", "b2"]);
  });

  it("returns everything when there are fewer photos than asked for", () => {
    expect(latestImages(dates, 20)).toEqual(["c1", "c2", "b1", "b2", "b3", "a1", "a2"]);
    expect(latestImages([], 8)).toEqual([]);
  });
});
