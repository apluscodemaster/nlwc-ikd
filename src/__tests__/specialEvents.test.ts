import { describe, it, expect } from "vitest";
import { secondSaturday, specialEventsForMonth } from "@/lib/specialEvents";

const datesAndLabels = (year: number, month: number) =>
  specialEventsForMonth(year, month).map((e) => `${e.date} ${e.label}`);

describe("specialEventsForMonth", () => {
  it("finds the 2nd Saturday whatever weekday the month starts on", () => {
    expect(secondSaturday(2026, 10)).toBe(14); // Nov 2026 starts on a Sunday
    expect(secondSaturday(2026, 7)).toBe(8); // Aug 2026 starts on a Saturday
    expect(secondSaturday(2026, 11)).toBe(12); // Dec 2026 starts on a Tuesday
  });

  it("adds Sithrah with its Thursday and Friday prep prayers", () => {
    expect(datesAndLabels(2026, 10)).toEqual([
      "2026-11-12 Sithrah Preparatory Prayer",
      "2026-11-13 Sithrah Preparatory Prayer",
      "2026-11-14 Sithrah",
    ]);
  });

  it("keeps the prep prayers in the same month when Sithrah is the 8th", () => {
    expect(datesAndLabels(2026, 7)).toEqual([
      "2026-08-06 Sithrah Preparatory Prayer",
      "2026-08-07 Sithrah Preparatory Prayer",
      "2026-08-08 Sithrah",
    ]);
  });

  it("adds every February Sunday for the Season of the Spirit", () => {
    const sos = specialEventsForMonth(2027, 1)
      .filter((e) => e.label === "Season of the Spirit")
      .map((e) => e.date);
    expect(sos).toEqual([
      "2027-02-07",
      "2027-02-14",
      "2027-02-21",
      "2027-02-28",
    ]);
  });

  it("adds only the 1st Sunday of March for the Season of the Spirit", () => {
    const sos = specialEventsForMonth(2027, 2).filter(
      (e) => e.label === "Season of the Spirit",
    );
    expect(sos.map((e) => e.date)).toEqual(["2027-03-07"]);
    expect(sos[0].startHour).toBe(8);
  });

  it("adds no Season of the Spirit outside February and March", () => {
    expect(
      specialEventsForMonth(2026, 10).some(
        (e) => e.label === "Season of the Spirit",
      ),
    ).toBe(false);
  });
});
