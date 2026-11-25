/**
 * Site pop-ups, managed from Admin → Settings → Pop-ups (Firestore
 * `site_popups`, see lib/popupStore.server.ts) and shown by
 * components/popups/SitePopups. Shared by the server and the browser, so no
 * server-only imports here.
 *
 * Three pop-ups used to be hard-coded; they're now "built-in" kinds whose
 * behaviour stays in code (finding the nearest fellowship centre, showing the
 * latest devotional, the first-time visitor form) while their wording, pages,
 * timing, frequency and dates are managed like any other pop-up. Admins can
 * also create "announcement" pop-ups (title, message, image, button).
 */

export type PopupKind = "announcement" | "fellowship" | "devotional" | "first-time-visitor";

export type PopupFrequency =
  /** Every page load. */
  | "every-visit"
  /** Once per browser session (until the tab/browser is closed). */
  | "once-per-session"
  /** After it's closed, not again for `frequencyDays` days. */
  | "once-every-days"
  /** Until the visitor does what it asks (taps the button / sends the form);
   *  closing it only hides it for the session. */
  | "until-completed";

export interface SitePopup {
  id: string;
  kind: PopupKind;
  /** Admin-only label. */
  name: string;
  active: boolean;

  /** Small label above the title, e.g. "House Fellowship". */
  eyebrow: string;
  title: string;
  message: string;
  /** Full image URL (announcements). */
  imageUrl: string;
  /** What the image shows, for screen readers (image-only pop-ups). */
  imageAlt?: string;
  /** Main button. Announcements: opens ctaUrl. Built-ins: their own action. */
  ctaLabel: string;
  ctaUrl: string;
  /** Secondary "close" button text. */
  dismissLabel: string;
  /** WhatsApp number (digits, with country code) the built-ins contact. */
  whatsapp: string;
  /** Centred dialog, a card in the bottom corner, or (image-only) moving
   *  across the bottom of the screen, left to right. */
  layout: "modal" | "corner" | "walk";

  /** Paths it shows on ("/" is the home page only; others match the path
   *  and everything under it). Empty = every page. */
  includePaths: string[];
  /** Paths it never shows on (same matching). */
  excludePaths: string[];
  /** Only while a service is live (schedule + stream, lib/liveSchedule). */
  liveOnly: boolean;
  delaySeconds: number;
  frequency: PopupFrequency;
  frequencyDays: number;
  /** ISO timestamps; empty = no limit. */
  startsAt: string;
  endsAt: string;
  /** Higher first when two are ready at once. */
  priority: number;

  createdAt?: string;
  updatedAt?: string;
}

/** Editable fields (everything but the id and timestamps). */
export type SitePopupInput = Omit<SitePopup, "id" | "createdAt" | "updatedAt">;

const BLANK: Omit<SitePopupInput, "kind" | "name"> = {
  active: true,
  eyebrow: "",
  title: "",
  message: "",
  imageUrl: "",
  imageAlt: "",
  ctaLabel: "",
  ctaUrl: "",
  dismissLabel: "",
  whatsapp: "",
  layout: "modal",
  includePaths: [],
  excludePaths: [],
  liveOnly: false,
  delaySeconds: 5,
  frequency: "once-per-session",
  frequencyDays: 7,
  startsAt: "",
  endsAt: "",
  priority: 0,
};

/** A new announcement's starting values (admin "Create"). It starts as a
 *  draft (off) so nothing reaches visitors before it's been previewed and
 *  published. */
export function newAnnouncement(): SitePopupInput {
  return { ...BLANK, active: false, kind: "announcement", name: "", ctaLabel: "Learn more", dismissLabel: "Close" };
}

/**
 * "Preview on site": the admin's draft is put in THEIR browser's storage and
 * the page opened with ?popup-preview=1, where SitePopups shows it at once
 * (whatever its switch, dates, pages or frequency say). Nobody else sees it.
 */
export const PREVIEW_STORAGE_KEY = "nlwc-popup-preview";
export const PREVIEW_PARAM = "popup-preview";

/** The page to preview a pop-up on: the first page it targets, else home. */
export function previewPath(popup: Pick<SitePopup, "includePaths">): string {
  return popup.includePaths[0] || "/";
}

/**
 * The three formerly hard-coded pop-ups, with exactly their old behaviour.
 * Seeded into Firestore once, and used as-is if the admin list can't load,
 * so they keep running either way. Their ids are fixed.
 */
export const BUILT_IN_POPUPS: SitePopup[] = [
  {
    ...BLANK,
    id: "fellowship",
    kind: "fellowship",
    name: "House fellowship: find a centre near you",
    eyebrow: "House Fellowship",
    title: "Join a Family Near You",
    message:
      "Our house fellowship centers are places of deep connection, prayer, and spiritual growth. Do you already belong to one?",
    ctaLabel: "Find a Center Near Me",
    dismissLabel: "Yes, I belong to one",
    whatsapp: "2347066644051",
    excludePaths: ["/fellowship", "/welcome"],
    delaySeconds: 30,
    frequency: "once-every-days",
    frequencyDays: 30,
    priority: 10,
  },
  {
    ...BLANK,
    id: "devotional",
    kind: "devotional",
    name: "Today's devotional (home page)",
    eyebrow: "Today's Devotional",
    // The title and date come from the latest devotional.
    ctaLabel: "Read Now",
    dismissLabel: "Later",
    layout: "corner",
    includePaths: ["/"],
    delaySeconds: 1,
    frequency: "once-per-session",
    priority: 20,
  },
  {
    ...BLANK,
    id: "first-time-visitor",
    kind: "first-time-visitor",
    name: "First-time live stream viewer form",
    eyebrow: "First Time Here?",
    title: "Welcome to Our Live Stream!",
    message: "We'd love to know you better. Please share your details so we can stay connected.",
    ctaLabel: "Connect with Us",
    dismissLabel: "Cancel, this is not my first time!",
    whatsapp: "2348137436770",
    includePaths: ["/live", "/listen-live"],
    liveOnly: true,
    delaySeconds: 15,
    frequency: "until-completed",
    priority: 30,
  },
];

export const BUILT_IN_IDS = new Set(BUILT_IN_POPUPS.map((p) => p.id));

/** Admin pages never show pop-ups. */
const NEVER_ON = ["/admin"];

function pathMatches(pathname: string, pattern: string): boolean {
  const p = pattern.trim();
  if (!p) return false;
  if (p === "/") return pathname === "/";
  const base = p.replace(/\/+$/, "");
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Whether a pop-up may show on `pathname`. */
export function showsOnPath(popup: Pick<SitePopup, "includePaths" | "excludePaths">, pathname: string): boolean {
  if (NEVER_ON.some((p) => pathMatches(pathname, p))) return false;
  if (popup.excludePaths.some((p) => pathMatches(pathname, p))) return false;
  return popup.includePaths.length === 0 || popup.includePaths.some((p) => pathMatches(pathname, p));
}

/** Within its start/end dates at `now`. */
export function isWithinDates(popup: Pick<SitePopup, "startsAt" | "endsAt">, now = new Date()): boolean {
  const t = now.getTime();
  if (popup.startsAt && t < Date.parse(popup.startsAt)) return false;
  if (popup.endsAt && t > Date.parse(popup.endsAt)) return false;
  return true;
}

/** What the visitor's browser remembers about a pop-up. */
export interface PopupMemory {
  /** Epoch ms when it was last closed. */
  closedAt?: number;
  /** They did what it asked (tapped the button / sent the form). */
  completed?: boolean;
  /** Closed in this browser session (sessionStorage). */
  closedThisSession?: boolean;
}

/** Whether the visitor should see it again, given what their browser remembers. */
export function dueByFrequency(
  popup: Pick<SitePopup, "frequency" | "frequencyDays">,
  memory: PopupMemory,
  now = Date.now(),
): boolean {
  switch (popup.frequency) {
    case "every-visit":
      return true;
    case "once-per-session":
      return !memory.closedThisSession;
    case "once-every-days":
      return !memory.closedAt || now - memory.closedAt >= Math.max(0, popup.frequencyDays) * 86_400_000;
    case "until-completed":
      return !memory.completed && !memory.closedThisSession;
  }
}

/** Status shown in the admin list. */
export function popupStatus(popup: SitePopup, now = new Date()): "off" | "scheduled" | "ended" | "on" {
  if (!popup.active) return "off";
  if (popup.startsAt && now.getTime() < Date.parse(popup.startsAt)) return "scheduled";
  if (popup.endsAt && now.getTime() > Date.parse(popup.endsAt)) return "ended";
  return "on";
}

/** Browser storage keys the old hard-coded pop-ups used, so visitors who
 *  already closed or answered them aren't asked again. */
export const LEGACY_KEYS: Record<string, { local?: string; session?: string; kind: "closedAt" | "completed" | "session" }> = {
  fellowship: { local: "nlwc-fellowship-prompt-dismissed", kind: "closedAt" },
  devotional: { session: "devotional_prompt_dismissed", kind: "session" },
  "first-time-visitor": { local: "nlwc-ikd-first-time-streamer", kind: "completed" },
};
