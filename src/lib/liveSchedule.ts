/**
 * Service schedule definitions and helper utilities.
 *
 * Each entry describes a recurring weekly service with the day-of-week
 * (0 = Sunday, 3 = Wednesday …), start / end hours, and a human-readable
 * label used in the countdown display.
 */

export interface ScheduledService {
  /** 0 = Sun, 1 = Mon … 6 = Sat */
  dayOfWeek: number;
  /** 24-h start hour */
  startHour: number;
  /** 24-h end hour (exclusive) */
  endHour: number;
  /** Display name shown alongside the countdown */
  label: string;
}

/** All recurring services that are streamed live. */
export const LIVE_SERVICES: ScheduledService[] = [
  { dayOfWeek: 0, startHour: 8, endHour: 12, label: "Sunday Service" },
  { dayOfWeek: 3, startHour: 18, endHour: 21, label: "Prayer Meeting" },
];

/* ------------------------------------------------------------------ */
/*  SPECIAL ONE-OFF SERVICES (e.g. retreats, conferences)              */
/* ------------------------------------------------------------------ */

interface SpecialService {
  /** Exact calendar date (only year/month/day matter) */
  year: number;
  month: number; // 0-indexed (0 = Jan, 3 = Apr)
  day: number;
  startHour: number;
  endHour: number;
  label: string;
}

/** One-off services that should trigger live status & appear in countdown. */
const SPECIAL_SERVICES: SpecialService[] = [
  // ── Teenager's Retreat (April 2–5, 2026) ──
  { year: 2026, month: 3, day: 2, startHour: 18, endHour: 23.5, label: "Teenager's Retreat — Day 1 Evening Session" },
  { year: 2026, month: 3, day: 3, startHour: 9,  endHour: 12,   label: "Teenager's Retreat — Day 2 Morning Session" },
  { year: 2026, month: 3, day: 3, startHour: 18, endHour: 23.5, label: "Teenager's Retreat — Day 2 Evening Session" },
  { year: 2026, month: 3, day: 4, startHour: 18, endHour: 23.5, label: "Teenager's Retreat Grand Finale" },

  // ── Special Meeting with Pastor Tosin Gabriel (April 9–11, 2026) ──
  { year: 2026, month: 3, day: 9,  startHour: 18, endHour: 23.5, label: "Special Meeting with Pastor Tosin Gabriel — Day 1" },
  { year: 2026, month: 3, day: 10, startHour: 18, endHour: 23.5, label: "Special Meeting with Pastor Tosin Gabriel — Day 2" },
  { year: 2026, month: 3, day: 11, startHour: 18, endHour: 23.5, label: "Special Meeting with Pastor Tosin Gabriel — Day 3" },
];

/** Convert fractional hour to total minutes for precise comparison. */
function toMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** Check if a special service is live right now. */
function isSpecialServiceLive(now: Date): boolean {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const nowMins = toMinutes(now);
  return SPECIAL_SERVICES.some(
    (s) => s.year === y && s.month === m && s.day === d && nowMins >= s.startHour * 60 && nowMins < s.endHour * 60,
  );
}

/** Get the label of the special service that is currently live. */
function getSpecialServiceLabel(now: Date): string | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const nowMins = toMinutes(now);
  const match = SPECIAL_SERVICES.find(
    (s) => s.year === y && s.month === m && s.day === d && nowMins >= s.startHour * 60 && nowMins < s.endHour * 60,
  );
  return match?.label ?? null;
}

/* ------------------------------------------------------------------ */

/** Returns `true` when the current time falls inside any live window. */
export function isCurrentlyLive(now = new Date()): boolean {
  // Check special one-off services first
  if (isSpecialServiceLive(now)) return true;

  const day = now.getDay();
  const hour = now.getHours();
  return LIVE_SERVICES.some(
    (s) => s.dayOfWeek === day && hour >= s.startHour && hour < s.endHour,
  );
}

/* ------------------------------------------------------------------ */

export interface NextServiceInfo {
  /** Absolute Date of the next service start */
  date: Date;
  /** Human-readable label, e.g. "Sunday Service" */
  label: string;
  /** Formatted date string, e.g. "Sunday, 01 March" */
  formattedDate: string;
}

/**
 * Find the closest upcoming service start time.
 *
 * If we are currently in a live window the function still returns the
 * *next* service (i.e. "what comes after the one running now").
 */

export function getNextService(now = new Date()): NextServiceInfo {
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;

  // Build candidate dates for every service within the next 7 days
  let best: { date: Date; label: string } | null = null;

  // --- Check special one-off services ---
  for (const sp of SPECIAL_SERVICES) {
    const spDate = new Date(sp.year, sp.month, sp.day, sp.startHour, 0, 0, 0);
    if (spDate.getTime() > now.getTime()) {
      if (!best || spDate.getTime() < best.date.getTime()) {
        best = { date: spDate, label: sp.label };
      }
    }
  }

  // --- Check recurring weekly services ---
  for (const service of LIVE_SERVICES) {
    let daysAhead = (service.dayOfWeek - day + 7) % 7;

    if (daysAhead === 0) {
      const serviceStart = service.startHour * 60;
      if (currentMinutes >= serviceStart) {
        daysAhead = 7;
      }
    }

    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + daysAhead);
    candidate.setHours(service.startHour, 0, 0, 0);

    if (!best || candidate.getTime() < best.date.getTime()) {
      best = { date: candidate, label: service.label };
    }
  }

  // Fallback — should never happen if LIVE_SERVICES is non-empty
  if (!best) {
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 7);
    best = { date: fallback, label: "Service" };
  }

  return {
    date: best.date,
    label: best.label,
    formattedDate: formatServiceDate(best.date),
  };
}

/* ------------------------------------------------------------------ */

/**
 * Format a date as e.g. "Sunday, 02 March"
 */
function formatServiceDate(date: Date): string {
  const dayName = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  return `${dayName}, ${day} ${month}`;
}

/* ------------------------------------------------------------------ */

/** Map of day-of-week to the meeting title shown on the streaming page. */
const DAY_MEETING_TITLES: Record<number, string> = {
  0: "Sunday Worship Experience", // Sunday
  3: "Prayer Meeting", // Wednesday
  5: "Bible Study", // Friday
};



/**
 * Fridays where Bible Study is cancelled.
 * April 3  – Teenager's Retreat
 * April 10 – Special Meeting with Pastor Tosin Gabriel
 */
const BIBLE_STUDY_SKIP_DATES = [
  new Date(2026, 3, 3).toDateString(),
  new Date(2026, 3, 10).toDateString(),
];

/**
 * Returns the meeting title for the streaming page.
 *
 * Priority:
 * 1. If a special service is currently live → its label.
 * 2. Otherwise, find the most recent past event (special OR regular weekly)
 *    and show its label.  This makes the title "stick" until a newer
 *    event starts.
 */
export function getCurrentMeetingTitle(now = new Date()): string {
  // 1. Special service currently live takes top priority
  const specialLabel = getSpecialServiceLabel(now);
  if (specialLabel) return specialLabel;

  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // ── 2a. Find the most recent past SPECIAL service ──
  let mostRecentSpecial: { time: number; label: string } | null = null;

  for (const sp of SPECIAL_SERVICES) {
    // Build the end-time for this special service
    const spEnd = new Date(sp.year, sp.month, sp.day, sp.endHour, 0, 0, 0);
    if (spEnd.getTime() <= now.getTime()) {
      // This special service has already ended
      if (!mostRecentSpecial || spEnd.getTime() > mostRecentSpecial.time) {
        mostRecentSpecial = { time: spEnd.getTime(), label: sp.label };
      }
    }
  }

  // ── 2b. Find the most recent past REGULAR weekly meeting ──
  let mostRecentRegular: { time: number; label: string } | null = null;

  // Check regular meeting days (look back up to 7 days)
  for (let offset = 0; offset <= 7; offset++) {
    const checkDay = (day - offset + 7) % 7;

    // Is this a regular meeting day?
    if (!DAY_MEETING_TITLES[checkDay]) continue;

    // Skip cancelled Bible Study Fridays
    if (checkDay === 5) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - offset);
      if (BIBLE_STUDY_SKIP_DATES.includes(checkDate.toDateString())) continue;
    }

    // For today (offset 0), only count it if the service has started
    if (offset === 0) {
      // Find the matching LIVE_SERVICES entry for this day to get startHour
      const svc = LIVE_SERVICES.find((s) => s.dayOfWeek === checkDay);
      if (svc) {
        const startMinutes = svc.startHour * 60;
        const currentMinutes = hour * 60 + minute;
        if (currentMinutes < startMinutes) continue; // hasn't started yet today
        // Build end time for today's regular service
        const regEnd = new Date(now);
        regEnd.setHours(svc.endHour, 0, 0, 0);
        mostRecentRegular = {
          time: Math.min(regEnd.getTime(), now.getTime()), // cap at now if still live
          label: DAY_MEETING_TITLES[checkDay],
        };
      }
    } else {
      // Past day — use the end time of that day's service
      const svc = LIVE_SERVICES.find((s) => s.dayOfWeek === checkDay);
      const endHour = svc?.endHour ?? 21;
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - offset);
      pastDate.setHours(endHour, 0, 0, 0);
      mostRecentRegular = {
        time: pastDate.getTime(),
        label: DAY_MEETING_TITLES[checkDay],
      };
    }

    // We found the most recent regular meeting — stop looking
    if (mostRecentRegular) break;
  }

  // ── 3. Return whichever ended more recently ──
  if (mostRecentSpecial && mostRecentRegular) {
    return mostRecentSpecial.time >= mostRecentRegular.time
      ? mostRecentSpecial.label
      : mostRecentRegular.label;
  }
  if (mostRecentSpecial) return mostRecentSpecial.label;
  if (mostRecentRegular) return mostRecentRegular.label;

  // Fallback (should never reach)
  return "Worship Experience";
}

