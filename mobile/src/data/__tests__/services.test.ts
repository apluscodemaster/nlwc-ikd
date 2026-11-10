import { BookOpen, Calendar, Church, PrayingHands } from "~/components/icons";
import { serviceIcon } from "../services";

describe("serviceIcon", () => {
  it("maps the admin schedule's categories", () => {
    expect(serviceIcon({ category: "Worship", label: "Sunday Worship Service" })).toBe(Church);
    expect(serviceIcon({ category: "Prayer", label: "Prayer Meeting" })).toBe(PrayingHands);
    expect(serviceIcon({ category: "Study", label: "Bible Study" })).toBe(BookOpen);
  });

  it("falls back to the label, then a calendar", () => {
    expect(serviceIcon({ category: undefined, label: "Midweek Bible Class" })).toBe(BookOpen);
    expect(serviceIcon({ category: "Youth", label: "Youth Hangout" })).toBe(Calendar);
  });
});
