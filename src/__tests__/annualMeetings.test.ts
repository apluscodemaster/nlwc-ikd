import { describe, expect, it } from "vitest";
import { Sparkles } from "lucide-react";
import { annualMeetings, annualVisual } from "@/data/services";

describe("annualVisual", () => {
  it("keeps the built-in look (and image) for a known meeting, whatever its case", () => {
    const family = annualMeetings.find((m) => m.id === "family-life-festival")!;
    expect(annualVisual({ name: " family life festival " })).toBe(family);
    expect(family.image).toMatch(/^https:\/\//);
  });

  it("gives a new meeting a generic look with no fallback image", () => {
    const v = annualVisual({ name: "Youth Convention" });
    expect(v.icon).toBe(Sparkles);
    expect(v.image).toBeUndefined();
  });
});
