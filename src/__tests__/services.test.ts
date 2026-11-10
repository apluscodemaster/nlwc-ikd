import { describe, expect, it } from "vitest";
import { BookOpen, Calendar, Church } from "lucide-react";
import PrayingHands from "@/components/shared/PrayingHandsIcon";
import {
  annualMeetings,
  formatServiceHour,
  serviceDayLabel,
  serviceVisual,
} from "@/data/services";

describe("formatServiceHour", () => {
  it("formats admin decimal hours (Lagos wall-clock)", () => {
    expect(formatServiceHour(8)).toBe("8:00 AM");
    expect(formatServiceHour(18)).toBe("6:00 PM");
    expect(formatServiceHour(18.5)).toBe("6:30 PM");
    expect(formatServiceHour(0)).toBe("12:00 AM");
    expect(formatServiceHour(12)).toBe("12:00 PM");
  });
});

describe("serviceDayLabel", () => {
  it("prefers the admin recurrence label", () => {
    expect(serviceDayLabel({ recurrenceLabel: "Every Thursday", dayOfWeek: 4 })).toBe("Every Thursday");
  });
  it("falls back to the weekday", () => {
    expect(serviceDayLabel({ recurrenceLabel: undefined, dayOfWeek: 3 })).toBe("Every Wednesday");
  });
});

describe("serviceVisual", () => {
  it("maps the admin categories", () => {
    expect(serviceVisual({ category: "Worship", label: "Sunday Worship Service" }).icon).toBe(Church);
    expect(serviceVisual({ category: "Prayer", label: "Prayer Meeting" }).icon).toBe(PrayingHands);
    expect(serviceVisual({ category: "Study", label: "Bible Study" }).icon).toBe(BookOpen);
    expect(serviceVisual({ category: "Youth", label: "Youth Hangout" }).icon).toBe(Calendar);
  });
});

describe("annualMeetings", () => {
  it("lists Season of the Spirit and Family Life Festival", () => {
    expect(annualMeetings.map((m) => m.name)).toEqual(["Season of the Spirit", "Family Life Festival"]);
  });
});
