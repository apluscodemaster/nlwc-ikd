import { describe, it, expect } from "vitest";
import {
  scheduledPublishDateTime,
  SCHEDULED_RELEASE_TIME,
} from "@/utils/publishSchedule";

// Fixed "now" so the future/past split is deterministic: 15 Jun 2026, 09:00
// site-local. Parsed the same naive way the helper parses its own candidates.
const NOW = new Date("2026-06-15T09:00:00").getTime();

describe("scheduledPublishDateTime", () => {
  it("uses the 12:30 AM release slot for a future date", () => {
    expect(scheduledPublishDateTime("2026-06-20", undefined, NOW)).toBe(
      `2026-06-20T${SCHEDULED_RELEASE_TIME}`,
    );
  });

  it("releases at 12:30 AM, not midnight", () => {
    expect(scheduledPublishDateTime("2026-06-20", undefined, NOW)).toBe(
      "2026-06-20T00:30:00",
    );
  });

  // The scoping fix: editing an already-published manual must not move when it
  // originally went out.
  it("preserves the original time of an already-published manual", () => {
    expect(
      scheduledPublishDateTime("2026-06-14", "2026-06-14T00:15:00", NOW),
    ).toBe("2026-06-14T00:15:00");
  });

  it("preserves seconds exactly, with no rounding to the nearest 5 minutes", () => {
    expect(
      scheduledPublishDateTime("2026-06-14", "2026-06-14T08:07:43", NOW),
    ).toBe("2026-06-14T08:07:43");
  });

  it("treats today as already past once 12:30 AM has gone", () => {
    // NOW is 09:00 on the 15th, so the 15th's 00:30 slot is behind us.
    expect(
      scheduledPublishDateTime("2026-06-15", "2026-06-15T00:20:00", NOW),
    ).toBe("2026-06-15T00:20:00");
  });

  it("still schedules today when 12:30 AM has not yet passed", () => {
    const earlyNow = new Date("2026-06-15T00:05:00").getTime();
    expect(scheduledPublishDateTime("2026-06-15", undefined, earlyNow)).toBe(
      `2026-06-15T${SCHEDULED_RELEASE_TIME}`,
    );
  });

  it("re-schedules to the release slot when a published manual is moved to a future date", () => {
    expect(
      scheduledPublishDateTime("2026-07-01", "2026-06-14T08:07:43", NOW),
    ).toBe(`2026-07-01T${SCHEDULED_RELEASE_TIME}`);
  });

  it("carries the original time of day onto a different past date", () => {
    expect(
      scheduledPublishDateTime("2026-06-10", "2026-06-14T08:07:43", NOW),
    ).toBe("2026-06-10T08:07:43");
  });

  it("falls back to the release slot for a past date with no original", () => {
    expect(scheduledPublishDateTime("2026-06-10", undefined, NOW)).toBe(
      `2026-06-10T${SCHEDULED_RELEASE_TIME}`,
    );
  });

  it("ignores an unparseable original timestamp", () => {
    expect(scheduledPublishDateTime("2026-06-10", "not-a-date", NOW)).toBe(
      `2026-06-10T${SCHEDULED_RELEASE_TIME}`,
    );
  });

  it("returns null without a date", () => {
    expect(scheduledPublishDateTime("", "2026-06-14T08:07:43", NOW)).toBeNull();
  });
});
