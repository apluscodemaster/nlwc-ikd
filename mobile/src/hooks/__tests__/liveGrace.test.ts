import { LIVE_GRACE_MS, readLiveStatus } from "../useLiveStatus";
import { loadScheduleFromApi } from "~/shared";

// Sunday 15 Nov 2026, service 9:00–12:00 Lagos time (UTC+1).
const lagos = (hhmm: string) => new Date(`2026-11-15T${hhmm}:00+01:00`);

beforeAll(async () => {
  const realFetch = global.fetch;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      recurring: [{ dayOfWeek: 0, startHour: 9, endHour: 12, label: "Sunday Service", active: true }],
      special: [],
    }),
  })) as unknown as typeof fetch;
  await loadScheduleFromApi();
  global.fetch = realFetch;
});

describe("live status grace period", () => {
  it("is live, on schedule, during the service", () => {
    expect(readLiveStatus(lagos("11:00"))).toMatchObject({ isLive: true, overtime: false });
  });

  it("stays live as overtime for up to 45 minutes after the scheduled end", () => {
    expect(LIVE_GRACE_MS).toBe(45 * 60 * 1000);
    const s = readLiveStatus(lagos("12:30"));
    expect(s).toMatchObject({ isLive: true, overtime: true });
    expect(s.currentTitle).toBe("Sunday Service");
    expect(readLiveStatus(lagos("12:44")).isLive).toBe(true);
  });

  it("goes off air once the grace period is over", () => {
    expect(readLiveStatus(lagos("12:50"))).toMatchObject({ isLive: false, overtime: false });
  });

  it("is not live before the service starts", () => {
    expect(readLiveStatus(lagos("08:30")).isLive).toBe(false);
  });
});
