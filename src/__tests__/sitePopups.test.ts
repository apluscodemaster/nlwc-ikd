import { describe, expect, it } from "vitest";
import { vi } from "vitest";
vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => ({}) }));
import {
  BUILT_IN_POPUPS,
  dueByFrequency,
  isWithinDates,
  newAnnouncement,
  popupStatus,
  previewPath,
  showsOnPath,
} from "@/lib/sitePopups";
import { popupInputSchema } from "@/lib/popupStore.server";

const byId = (id: string) => BUILT_IN_POPUPS.find((p) => p.id === id)!;

describe("site pop-ups", () => {
  it("keeps the three old pop-ups' behaviour as built-in defaults", () => {
    expect(byId("fellowship")).toMatchObject({ delaySeconds: 30, frequency: "once-every-days", frequencyDays: 30 });
    expect(byId("devotional")).toMatchObject({ includePaths: ["/"], frequency: "once-per-session", layout: "corner" });
    expect(byId("first-time-visitor")).toMatchObject({
      includePaths: ["/live", "/listen-live"],
      liveOnly: true,
      delaySeconds: 15,
      frequency: "until-completed",
    });
  });

  it("matches pages: / is home only, others cover sub-pages, admin never", () => {
    const fellowship = byId("fellowship");
    expect(showsOnPath(fellowship, "/sermons/audio/12")).toBe(true);
    expect(showsOnPath(fellowship, "/fellowship")).toBe(false);
    expect(showsOnPath(fellowship, "/admin/settings")).toBe(false);
    const devotional = byId("devotional");
    expect(showsOnPath(devotional, "/")).toBe(true);
    expect(showsOnPath(devotional, "/about")).toBe(false);
    expect(showsOnPath(byId("first-time-visitor"), "/listen-live")).toBe(true);
    expect(showsOnPath(byId("first-time-visitor"), "/liveliness")).toBe(false);
  });

  it("respects start and end dates", () => {
    const p = { startsAt: "2026-12-01T00:00:00Z", endsAt: "2026-12-25T00:00:00Z" };
    expect(isWithinDates(p, new Date("2026-11-30T12:00:00Z"))).toBe(false);
    expect(isWithinDates(p, new Date("2026-12-10T12:00:00Z"))).toBe(true);
    expect(isWithinDates(p, new Date("2026-12-26T00:00:00Z"))).toBe(false);
    expect(isWithinDates({ startsAt: "", endsAt: "" })).toBe(true);
  });

  it("decides frequency from what the browser remembers", () => {
    const now = Date.UTC(2026, 10, 25);
    const day = 86_400_000;
    expect(dueByFrequency({ frequency: "once-every-days", frequencyDays: 30 }, { closedAt: now - 10 * day }, now)).toBe(false);
    expect(dueByFrequency({ frequency: "once-every-days", frequencyDays: 30 }, { closedAt: now - 31 * day }, now)).toBe(true);
    expect(dueByFrequency({ frequency: "once-per-session", frequencyDays: 1 }, { closedThisSession: true }, now)).toBe(false);
    expect(dueByFrequency({ frequency: "until-completed", frequencyDays: 1 }, { completed: true }, now)).toBe(false);
    expect(dueByFrequency({ frequency: "until-completed", frequencyDays: 1 }, {}, now)).toBe(true);
    expect(dueByFrequency({ frequency: "every-visit", frequencyDays: 1 }, { completed: true }, now)).toBe(true);
  });

  it("starts new announcements as drafts and previews them on their first page", () => {
    const draft = newAnnouncement();
    expect(draft.active).toBe(false);
    expect(popupStatus({ ...draft, id: "x" })).toBe("off");
    expect(previewPath({ includePaths: ["/live", "/"] })).toBe("/live");
    expect(previewPath({ includePaths: [] })).toBe("/");
  });

  it("allows image-only announcements, including site files, moving across the bottom", () => {
    const imageOnly = { ...newAnnouncement(), name: "FJR", title: "", ctaLabel: "", imageUrl: "/FJR-flag-caricature.png", layout: "walk" as const };
    expect(popupInputSchema.safeParse(imageOnly).success).toBe(true);
    expect(popupInputSchema.safeParse({ ...imageOnly, imageUrl: "/not-an-image.txt" }).success).toBe(false);
    expect(popupInputSchema.safeParse({ ...imageOnly, imageUrl: "" }).success).toBe(false);
  });

  it("validates admin input", () => {
    const ok = { ...newAnnouncement(), name: "Easter", title: "Easter Conference", ctaUrl: "/live" };
    expect(popupInputSchema.safeParse(ok).success).toBe(true);
    expect(popupInputSchema.safeParse({ ...ok, title: "" }).success).toBe(false);
    expect(popupInputSchema.safeParse({ ...ok, ctaUrl: "" }).success).toBe(false); // button without a link
    expect(popupInputSchema.safeParse({ ...ok, ctaUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(popupInputSchema.safeParse({ ...ok, imageUrl: "http://insecure.example/x.png" }).success).toBe(false);
    expect(popupInputSchema.safeParse({ ...ok, includePaths: ["live"] }).success).toBe(false);
    expect(
      popupInputSchema.safeParse({ ...ok, startsAt: "2026-12-10T00:00:00Z", endsAt: "2026-12-01T00:00:00Z" }).success,
    ).toBe(false);
  });
});
