import { dayName, formatHour } from "~/api/schedule";
import { formatClock } from "~/player/format";
import { formatCompactDate, splitDuration } from "../dates";

describe("formatCompactDate", () => {
  it("formats gallery dates as d Mon'yy", () => {
    expect(formatCompactDate("2026-11-04")).toBe("4 Nov'26");
    expect(formatCompactDate("2025-01-19")).toBe("19 Jan'25");
  });
  it("leaves unexpected input alone", () => {
    expect(formatCompactDate("Easter 2026")).toBe("Easter 2026");
    expect(formatCompactDate("2026-13-01")).toBe("2026-13-01");
  });
});

describe("formatHour", () => {
  it("formats admin decimal hours as Lagos wall-clock times", () => {
    expect(formatHour(8)).toBe("8:00 AM");
    expect(formatHour(18.5)).toBe("6:30 PM");
    expect(formatHour(0)).toBe("12:00 AM");
    expect(formatHour(12)).toBe("12:00 PM");
  });
});

describe("dayName", () => {
  it("maps 0 to Sunday", () => {
    expect(dayName(0)).toBe("Sunday");
    expect(dayName(6)).toBe("Saturday");
  });
});

describe("splitDuration", () => {
  it("splits seconds into d/h/m/s", () => {
    expect(splitDuration(93784)).toEqual({ d: 1, h: 2, m: 3, s: 4 });
    expect(splitDuration(-5)).toEqual({ d: 0, h: 0, m: 0, s: 0 });
  });
});

describe("formatClock", () => {
  it("formats player times", () => {
    expect(formatClock(75)).toBe("1:15");
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatClock(Number.NaN)).toBe("0:00");
  });
});
