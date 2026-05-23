/**
 * Service schedule definitions and helper utilities.
 *
 * Data flow:
 * 1. Hardcoded FALLBACK schedules are used by default (zero-latency).
 * 2. `loadScheduleFromApi()` fetches Firestore-backed data via /api/schedule.
 * 3. Once loaded, all helper functions use the dynamic data.
 * 4. Components call `loadScheduleFromApi()` once on mount; the module
 *    caches the result so subsequent calls are free.
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

/** Hardcoded fallback — used until Firestore data is loaded. */
const FALLBACK_RECURRING: ScheduledService[] = [
  { dayOfWeek: 0, startHour: 8, endHour: 15, label: "Sunday Service" },
  { dayOfWeek: 3, startHour: 18, endHour: 21, label: "Prayer Meeting" },
  { dayOfWeek: 5, startHour: 18, endHour: 22, label: "Bible Study" },
];

/** Exported for backward compatibility — points to the active list. */
export let LIVE_SERVICES: ScheduledService[] = [...FALLBACK_RECURRING];

/* ------------------------------------------------------------------ */
/*  SPECIAL ONE-OFF SERVICES                                           */
/* ------------------------------------------------------------------ */

interface SpecialServiceEntry {
  /** YYYY-MM-DD date string */
  date: string;
  startHour: number;
  endHour: number;
  label: string;
}

/** Parsed from SpecialServiceEntry for internal use. */
interface ParsedSpecial {
  year: number;
  month: number;
  day: number;
  startHour: number;
  endHour: number;
  label: string;
}

let specialServices: ParsedSpecial[] = [];

/* ------------------------------------------------------------------ */
/*  DYNAMIC LOADING                                                    */
/* ------------------------------------------------------------------ */

let loaded = false;
let loadPromise: Promise<void> | null = null;

function parseSpecialDate(entry: SpecialServiceEntry): ParsedSpecial {
  const [y, m, d] = entry.date.split("-").map(Number);
  return {
    year: y,
    month: m - 1, // JS months are 0-indexed
    day: d,
    startHour: entry.startHour,
    endHour: entry.endHour,
    label: entry.label,
  };
}

/**
 * Fetch schedule data from the API and cache it in module scope.
 * Safe to call multiple times — only the first call fetches.
 */
export async function loadScheduleFromApi(): Promise<void> {
  if (loaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch("/api/schedule");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Only override if we got valid data
      const recurring: ScheduledService[] = (data.recurring || [])
        .filter((r: { active?: boolean }) => r.active !== false)
        .map(
          (r: {
            dayOfWeek: number;
            startHour: number;
            endHour: number;
            label: string;
          }) => ({
            dayOfWeek: r.dayOfWeek,
            startHour: r.startHour,
            endHour: r.endHour,
            label: r.label,
          }),
        );

      if (recurring.length > 0) {
        LIVE_SERVICES = recurring;
      }

      specialServices = (data.special || [])
        .filter((s: { active?: boolean }) => s.active !== false)
        .map((s: SpecialServiceEntry) => parseSpecialDate(s));

      loaded = true;
    } catch (err) {
      console.warn(
        "[liveSchedule] Failed to load from API, using fallbacks:",
        err,
      );
      loaded = true; // Don't retry on failure — use fallbacks
    }
  })();

  return loadPromise;
}

/* ------------------------------------------------------------------ */
/*  HELPER FUNCTIONS (unchanged API, now use dynamic data)             */
/* ------------------------------------------------------------------ */

function toMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

function isSpecialServiceLive(now: Date): boolean {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const nowMins = toMinutes(now);
  return specialServices.some(
    (s) =>
      s.year === y &&
      s.month === m &&
      s.day === d &&
      nowMins >= s.startHour * 60 &&
      nowMins < s.endHour * 60,
  );
}

function getSpecialServiceLabel(now: Date): string | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const nowMins = toMinutes(now);
  const match = specialServices.find(
    (s) =>
      s.year === y &&
      s.month === m &&
      s.day === d &&
      nowMins >= s.startHour * 60 &&
      nowMins < s.endHour * 60,
  );
  return match?.label ?? null;
}

/* ------------------------------------------------------------------ */

/** Returns `true` when the current time falls inside any live window. */
export function isCurrentlyLive(now = new Date()): boolean {
  if (isSpecialServiceLive(now)) return true;

  const day = now.getDay();
  const hour = now.getHours();
  return LIVE_SERVICES.some(
    (s) => s.dayOfWeek === day && hour >= s.startHour && hour < s.endHour,
  );
}

/**
 * Returns the start timestamp (Unix ms) of the currently-live service,
 * or `null` if no service is live right now.
 */
export function getCurrentServiceStartTime(now = new Date()): number | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const nowMins = toMinutes(now);

  // Check special services first
  const special = specialServices.find(
    (s) =>
      s.year === y &&
      s.month === m &&
      s.day === d &&
      nowMins >= s.startHour * 60 &&
      nowMins < s.endHour * 60,
  );
  if (special) {
    return new Date(y, m, d, special.startHour, 0, 0, 0).getTime();
  }

  // Check recurring services
  const day = now.getDay();
  const hour = now.getHours();
  const recurring = LIVE_SERVICES.find(
    (s) => s.dayOfWeek === day && hour >= s.startHour && hour < s.endHour,
  );
  if (recurring) {
    return new Date(y, m, d, recurring.startHour, 0, 0, 0).getTime();
  }

  return null;
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
 * If we are currently in a live window the function still returns the
 * *next* service (i.e. "what comes after the one running now").
 */
export function getNextService(now = new Date()): NextServiceInfo {
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;

  let best: { date: Date; label: string } | null = null;

  // --- Check special one-off services ---
  for (const sp of specialServices) {
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

function formatServiceDate(date: Date): string {
  const dayName = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  return `${dayName}, ${day} ${month}`;
}

/* ------------------------------------------------------------------ */

/**
 * Returns the meeting title for the streaming page.
 *
 * Priority:
 * 1. If a special service is currently live → its label.
 * 2. Otherwise, find the most recent past event (special OR regular weekly)
 *    and show its label.
 */
export function getCurrentMeetingTitle(now = new Date()): string {
  const specialLabel = getSpecialServiceLabel(now);
  if (specialLabel) return specialLabel;

  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Build a map from recurring services for meeting titles
  const dayTitles: Record<number, string> = {};
  for (const svc of LIVE_SERVICES) {
    dayTitles[svc.dayOfWeek] = svc.label;
  }

  // ── Find the most recent past SPECIAL service ──
  let mostRecentSpecial: { time: number; label: string } | null = null;
  for (const sp of specialServices) {
    const spEnd = new Date(sp.year, sp.month, sp.day, sp.endHour, 0, 0, 0);
    if (spEnd.getTime() <= now.getTime()) {
      if (!mostRecentSpecial || spEnd.getTime() > mostRecentSpecial.time) {
        mostRecentSpecial = { time: spEnd.getTime(), label: sp.label };
      }
    }
  }

  // ── Find the most recent past REGULAR weekly meeting ──
  let mostRecentRegular: { time: number; label: string } | null = null;
  for (let offset = 0; offset <= 7; offset++) {
    const checkDay = (day - offset + 7) % 7;
    if (!dayTitles[checkDay]) continue;

    if (offset === 0) {
      const svc = LIVE_SERVICES.find((s) => s.dayOfWeek === checkDay);
      if (svc) {
        const startMinutes = svc.startHour * 60;
        const currentMinutes = hour * 60 + minute;
        if (currentMinutes < startMinutes) continue;
        const regEnd = new Date(now);
        regEnd.setHours(svc.endHour, 0, 0, 0);
        mostRecentRegular = {
          time: Math.min(regEnd.getTime(), now.getTime()),
          label: dayTitles[checkDay],
        };
      }
    } else {
      const svc = LIVE_SERVICES.find((s) => s.dayOfWeek === checkDay);
      const endHour = svc?.endHour ?? 21;
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - offset);
      pastDate.setHours(endHour, 0, 0, 0);
      mostRecentRegular = {
        time: pastDate.getTime(),
        label: dayTitles[checkDay],
      };
    }

    if (mostRecentRegular) break;
  }

  if (mostRecentSpecial && mostRecentRegular) {
    return mostRecentSpecial.time >= mostRecentRegular.time
      ? mostRecentSpecial.label
      : mostRecentRegular.label;
  }
  if (mostRecentSpecial) return mostRecentSpecial.label;
  if (mostRecentRegular) return mostRecentRegular.label;

  return "Worship Experience";
}
