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
  // Teenager's Retreat — April 2, 2026 evening session
  { year: 2026, month: 3, day: 2, startHour: 18, endHour: 21, label: "Teenager's Retreat" },
  // Teenager's Retreat — April 3, 2026 morning session
  { year: 2026, month: 3, day: 3, startHour: 9, endHour: 12, label: "Teenager's Retreat" },
  // Teenager's Retreat — April 3, 2026 evening session
  { year: 2026, month: 3, day: 3, startHour: 18, endHour: 21, label: "Teenager's Retreat" },
];

/** Check if a special service is live right now. */
function isSpecialServiceLive(now: Date): boolean {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const h = now.getHours();
  return SPECIAL_SERVICES.some(
    (s) => s.year === y && s.month === m && s.day === d && h >= s.startHour && h < s.endHour,
  );
}

/** Get the label of the special service that is currently live. */
function getSpecialServiceLabel(now: Date): string | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const h = now.getHours();
  const match = SPECIAL_SERVICES.find(
    (s) => s.year === y && s.month === m && s.day === d && h >= s.startHour && h < s.endHour,
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

/** Ordered meeting days for look-back calculation. */
const MEETING_DAYS = [0, 3, 5]; // Sun, Wed, Fri

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
 * If a special service is currently live, returns its label.
 * If today is a meeting day, returns that day's title.
 * Otherwise, returns the **most recent past** meeting's title so the
 * label persists until the next meeting starts (e.g. on Monday/Tuesday
 * it still shows "Sunday Worship Experience").
 */
export function getCurrentMeetingTitle(now = new Date()): string {
  // Special service takes priority
  const specialLabel = getSpecialServiceLabel(now);
  if (specialLabel) return specialLabel;

  const day = now.getDay();

  // If today is a meeting day, show its title
  // (but skip Bible Study on cancelled Fridays)
  if (DAY_MEETING_TITLES[day]) {
    if (day === 5 && BIBLE_STUDY_SKIP_DATES.includes(now.toDateString())) {
      // Bible Study is cancelled today — fall through to look-back
    } else {
      return DAY_MEETING_TITLES[day];
    }
  }

  // Find the most recent past meeting day
  for (let offset = 1; offset <= 7; offset++) {
    const checkDay = (day - offset + 7) % 7;
    if (MEETING_DAYS.includes(checkDay)) {
      return DAY_MEETING_TITLES[checkDay];
    }
  }

  // Fallback (should never reach)
  return "Worship Experience";
}

