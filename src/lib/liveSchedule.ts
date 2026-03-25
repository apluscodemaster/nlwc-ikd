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

/** Returns `true` when the current time falls inside any live window. */
export function isCurrentlyLive(now = new Date()): boolean {
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

  // Build candidate dates for every service within the next 7 days
  let best: { date: Date; label: string } | null = null;

  for (const service of LIVE_SERVICES) {
    // How many days ahead is this service?
    let daysAhead = (service.dayOfWeek - day + 7) % 7;

    // If same day, decide whether it's still ahead
    if (daysAhead === 0) {
      const currentMinutes = hour * 60 + minute;
      const serviceStart = service.startHour * 60;

      if (currentMinutes >= serviceStart) {
        // Already started (or passed) — jump to next week
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
  0: "Sunday Worship Experience",   // Sunday
  3: "Prayer Meeting",              // Wednesday
  5: "Bible Study",                 // Friday
};

/**
 * Returns the meeting title for the current day.
 *
 * If today has a scheduled meeting, returns its title (e.g. "Prayer Meeting").
 * Otherwise falls back to the next upcoming service label.
 */
export function getCurrentMeetingTitle(now = new Date()): string {
  const day = now.getDay();
  if (DAY_MEETING_TITLES[day]) {
    return DAY_MEETING_TITLES[day];
  }
  // Not a meeting day — show the next service label
  const next = getNextService(now);
  return next.label;
}

