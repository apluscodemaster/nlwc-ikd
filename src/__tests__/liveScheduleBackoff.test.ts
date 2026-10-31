import { describe, it, expect, vi, afterEach } from "vitest";

// The countdowns call loadScheduleFromApi() every second until the schedule
// loads. Without a backoff, a failing /api/schedule meant one request per
// second from every open tab, forever.
describe("loadScheduleFromApi backoff", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("waits longer between retries after each failure", async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const fetchMock = vi.fn(async () => new Response("down", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const { loadScheduleFromApi, isScheduleLoaded } =
      await import("@/lib/liveSchedule");

    await loadScheduleFromApi(); // fails → retry no sooner than 2s
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The countdowns tick every second — none of these may hit the network.
    await loadScheduleFromApi();
    vi.advanceTimersByTime(1_000);
    await loadScheduleFromApi();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1_500); // past 2s
    await loadScheduleFromApi(); // second failure → wait 4s
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(3_000);
    await loadScheduleFromApi(); // still inside the 4s window
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Recovers once the API is back.
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ recurring: [], special: [] }), {
          status: 200,
        }),
    );
    vi.advanceTimersByTime(1_500);
    await loadScheduleFromApi();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(isScheduleLoaded()).toBe(true);
  });
});
