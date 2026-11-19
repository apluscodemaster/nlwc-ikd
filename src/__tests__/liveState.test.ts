import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLiveServiceStartTime,
  getLiveTitle,
  getServiceLiveState,
  loadScheduleFromApi,
  setStreamState,
} from "@/lib/liveSchedule";

// Sunday 15 Nov 2026; Sunday Service 9:00–12:00 Lagos time (UTC+1).
const lagos = (hhmm: string) => new Date(`2026-11-15T${hhmm}:00+01:00`);

beforeAll(async () => {
  // Every fetch answers with the schedule; /api/video-stream then has no
  // status, i.e. "unknown". Tests set the stream state themselves.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        recurring: [{ dayOfWeek: 0, startHour: 9, endHour: 12, label: "Sunday Service", active: true }],
        special: [],
      }),
    })),
  );
  await loadScheduleFromApi();
});

describe("live state", () => {
  beforeEach(() => setStreamState("unknown"));

  it("is live during the scheduled time whatever the stream says", () => {
    setStreamState("ended");
    expect(getServiceLiveState(lagos("10:00"))).toMatchObject({ live: true, scheduled: true, overtime: false });
  });

  it("without a stream state, stays live for the 45-minute grace period", () => {
    expect(getServiceLiveState(lagos("12:30"))).toMatchObject({ live: true, overtime: true });
    expect(getServiceLiveState(lagos("12:50")).live).toBe(false);
  });

  it("stays live past the grace period while YouTube reports the stream live", () => {
    setStreamState("live");
    expect(getServiceLiveState(lagos("13:30"))).toMatchObject({ live: true, overtime: true });
    expect(getLiveTitle(lagos("13:30"))).toBe("Sunday Service");
    // The chat keeps the service's messages.
    expect(getLiveServiceStartTime(lagos("13:30"))).toBe(lagos("09:00").getTime());
  });

  it("ends as soon as YouTube reports the stream ended", () => {
    setStreamState("ended");
    expect(getServiceLiveState(lagos("12:05")).live).toBe(false);
    expect(getLiveServiceStartTime(lagos("12:05"))).toBeNull();
  });

  it("goes live early when the stream starts before the scheduled time", () => {
    setStreamState("live");
    expect(getServiceLiveState(lagos("08:30"))).toMatchObject({ live: true, early: true });
    expect(getLiveTitle(lagos("08:30"))).toBe("Sunday Service");
    setStreamState("upcoming");
    expect(getServiceLiveState(lagos("08:30")).live).toBe(false);
  });

  it("ignores a live stream far from any service", () => {
    setStreamState("live");
    expect(getServiceLiveState(lagos("20:00")).live).toBe(false);
  });
});
