import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  isCurrentlyLive,
  getCurrentServiceStartTime,
  getNextService,
  getCurrentMeetingTitle,
} from "@/lib/liveSchedule";

/*
 * Service times are Lagos (WAT, UTC+1) wall-clock times. Every instant below is
 * given in UTC so the expectations hold whatever zone the test machine — or a
 * viewer's browser — is in. Uses the built-in fallback schedule: Sunday 8–15,
 * Wednesday 18–21, Friday 18–22.
 */
const utc = (iso: string) => new Date(`${iso}Z`);

// Viewers' zones to run every case under. Set at runtime because the TZ
// environment variable is ignored on some platforms (e.g. Node on Windows).
const VIEWER_ZONES = [
  "Africa/Lagos",
  "UTC",
  "America/Los_Angeles",
  "Asia/Tokyo",
];

describe.each(VIEWER_ZONES)(
  "liveSchedule (Lagos time) — viewer in %s",
  (zone) => {
    const originalTz = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = zone;
    });
    afterAll(() => {
      process.env.TZ = originalTz;
    });

    it("is live during Sunday Service in Lagos", () => {
      // Sunday 18 Oct 2026, 09:00 in Lagos
      const now = utc("2026-10-18T08:00:00");
      expect(isCurrentlyLive(now)).toBe(true);
      // Service started 08:00 Lagos = 07:00 UTC
      expect(getCurrentServiceStartTime(now)).toBe(
        utc("2026-10-18T07:00:00").getTime(),
      );
    });

    it("is not live once the Lagos service has ended", () => {
      // 15:30 in Lagos (14:30 UTC) — Sunday Service ends at 15:00
      expect(isCurrentlyLive(utc("2026-10-18T14:30:00"))).toBe(false);
      expect(getCurrentServiceStartTime(utc("2026-10-18T14:30:00"))).toBeNull();
    });

    it("uses the Lagos hour, not the UTC hour, at the window edges", () => {
      // 17:30 UTC is 18:30 in Lagos — inside Wednesday's 18–21 window
      expect(isCurrentlyLive(utc("2026-10-21T17:30:00"))).toBe(true);
      // 20:30 UTC is 21:30 in Lagos — already over
      expect(isCurrentlyLive(utc("2026-10-21T20:30:00"))).toBe(false);
    });

    it("uses the Lagos day across midnight", () => {
      // Saturday 23:30 UTC is already Sunday 00:30 in Lagos — not yet live, and
      // the next service is that same Lagos Sunday at 08:00 (07:00 UTC).
      const now = utc("2026-10-17T23:30:00");
      expect(isCurrentlyLive(now)).toBe(false);
      const next = getNextService(now);
      expect(next.label).toBe("Sunday Service");
      expect(next.date.getTime()).toBe(utc("2026-10-18T07:00:00").getTime());
      expect(next.formattedDate).toBe("Sunday, 18 October");
    });

    it("finds next week's service once today's has started", () => {
      // Friday 23 Oct 2026, 19:00 Lagos — Bible Study running; next is Sunday
      const next = getNextService(utc("2026-10-23T18:00:00"));
      expect(next.label).toBe("Sunday Service");
      expect(next.date.getTime()).toBe(utc("2026-10-25T07:00:00").getTime());
    });

    it("titles the stream after the most recent Lagos meeting", () => {
      // Monday 19 Oct, 10:00 Lagos — last meeting was Sunday Service
      expect(getCurrentMeetingTitle(utc("2026-10-19T09:00:00"))).toBe(
        "Sunday Service",
      );
      // Thursday 22 Oct — last meeting was Wednesday's Prayer Meeting
      expect(getCurrentMeetingTitle(utc("2026-10-22T09:00:00"))).toBe(
        "Prayer Meeting",
      );
    });
  },
);
