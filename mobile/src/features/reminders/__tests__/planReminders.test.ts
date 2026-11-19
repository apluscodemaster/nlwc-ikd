// jest.mock is hoisted above the imports by babel-jest.
import { planReminders, REMIND_BEFORE_MS } from "../serviceReminders";
import { loadScheduleFromApi } from "~/shared";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

beforeAll(async () => {
  const realFetch = global.fetch;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      recurring: [
        { dayOfWeek: 0, startHour: 8, endHour: 12, label: "Sunday Worship Service", active: true },
        { dayOfWeek: 3, startHour: 18, endHour: 20, label: "Prayer Meeting", active: true },
      ],
      special: [{ date: "2026-11-28", startHour: 12, endHour: 15, label: "Sithrah", active: true }],
    }),
  })) as unknown as typeof fetch;
  await loadScheduleFromApi();
  global.fetch = realFetch;
});

describe("planReminders", () => {
  // Thursday 19 Nov 2026, 10:00 Lagos.
  const now = new Date("2026-11-19T10:00:00+01:00");

  it("reminds 30 minutes before each service in the next two weeks, soonest first", () => {
    const plan = planReminders(now);
    expect(REMIND_BEFORE_MS).toBe(30 * 60 * 1000);
    expect(plan.slice(0, 3).map((r) => r.at.toISOString())).toEqual([
      new Date("2026-11-22T07:30:00+01:00").toISOString(), // Sunday 8:00
      new Date("2026-11-25T17:30:00+01:00").toISOString(), // Wednesday 18:00
      new Date("2026-11-28T11:30:00+01:00").toISOString(), // Sithrah 12:00
    ]);
    expect(plan[0]).toMatchObject({ title: "Sunday Worship Service starts in 30 minutes" });
    expect(plan[0].body).toContain("8:00 AM Lagos time");
    // Two Sundays, two Wednesdays and the Sithrah within 14 days.
    expect(plan).toHaveLength(5);
  });

  it("skips a reminder whose time has already passed", () => {
    const plan = planReminders(new Date("2026-11-22T07:45:00+01:00"));
    expect(plan[0].title).toBe("Prayer Meeting starts in 30 minutes");
  });
});
