import { describe, expect, it } from "vitest";
import { retryDelayMs } from "@/lib/wordpress";

describe("WordPress 429 retry delay", () => {
  it("backs off 2 s, 4 s, 8 s without Retry-After", () => {
    expect([1, 2, 3].map((a) => retryDelayMs(a, null))).toEqual([2000, 4000, 8000]);
  });
  it("honours Retry-After, capped at 15 s", () => {
    expect(retryDelayMs(1, "5")).toBe(5000);
    expect(retryDelayMs(1, "120")).toBe(15000);
    expect(retryDelayMs(2, "not-a-number")).toBe(4000);
  });
});
