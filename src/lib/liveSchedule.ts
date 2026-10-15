/**
 * Service schedule definitions and helper utilities.
 *
 * Data flow:
 * 1. `loadScheduleFromApi()` fetches the admin-managed schedule (Firestore,
 *    via /api/schedule). There is no hardcoded fallback: until it loads, or
 *    if the admin has no services, nothing is live.
 * 2. Once loaded, all helper functions use that data.
 * 3. Components call `loadScheduleFromApi()` once on mount; the module
 *    caches the result so subsequent calls are free. A failed load is
 *    retried on the next call.
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

/**
 * The active weekly services, exactly as set on the admin Schedule page.
 * Empty until `loadScheduleFromApi()` resolves — there is deliberately no
 * hardcoded fallback, so a service an admin removes or deactivates can never
 * keep driving the live pages, chat window or countdown.
 */
export let LIVE_SERVICES: ScheduledService[] = [];

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

      // Taken as-is, even when empty: the admin schedule is the only source.
      LIVE_SERVICES = recurring;

      specialServices = (data.special || [])
        .filter((s: { active?: boolean }) => s.active !== false)
        .map((s: SpecialServiceEntry) => parseSpecialDate(s));

      loaded = true;
    } catch (err) {
      console.warn("[liveSchedule] Failed to load the schedule:", err);
      // Not marked loaded, so the next call tries again rather than running
      // on a schedule the admin never set.
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/** True once the admin schedule has loaded (helpers return "nothing live" and
 *  no next service until then). */
export function isScheduleLoaded(): boolean {
  return loaded;
}

/* ------------------------------------------------------------------ */
/*  LAGOS TIME                                                         */
/* ------------------------------------------------------------------ */

/*
 * Every service time (startHour, dayOfWeek, special dates) is Lagos wall-clock
 * time. These helpers used to read the VIEWER's clock (getHours/getDay), so
 * anyone outside Nigeria saw the wrong live window, chat window and countdown.
 * Everything below now works in Lagos time regardless of the viewer's zone.
 *
 * WAT is UTC+1 all year (Nigeria has no daylight saving), so a fixed offset is
 * exact and avoids Intl time-zone parsing on every tick.
 */
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const LAGOS_TZ = "Africa/Lagos";

interface LagosClock {
  year: number;
  /** 0-indexed, like Date#getMonth */
  month: number;
  day: number;
  /** 0 = Sun … 6 = Sat */
  dayOfWeek: number;
  hour: number;
  /** Minutes since Lagos midnight */
  minutes: number;
}

/** What a wall clock in Lagos reads at `now`. */
function lagosClock(now: Date): LagosClock {
  const t = new Date(now.getTime() + LAGOS_OFFSET_MS);
  return {
    year: t.getUTCFullYear(),
    month: t.getUTCMonth(),
    day: t.getUTCDate(),
    dayOfWeek: t.getUTCDay(),
    hour: t.getUTCHours(),
    minutes: t.getUTCHours() * 60 + t.getUTCMinutes(),
  };
}

/**
 * The instant at which Lagos clocks read `hour`:00 on the given date. Day
 * overflow (e.g. day + 7) rolls into the next month, as with Date.UTC.
 */
function lagosInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
): Date {
  return new Date(Date.UTC(year, month, day, hour) - LAGOS_OFFSET_MS);
}

/* ------------------------------------------------------------------ */
/*  HELPER FUNCTIONS (unchanged API, now use dynamic data)             */
/* ------------------------------------------------------------------ */

/** The special service running at `now` (Lagos time), if any. */
function findLiveSpecial(now: Date): ParsedSpecial | undefined {
  const c = lagosClock(now);
  return specialServices.find(
    (s) =>
      s.year === c.year &&
      s.month === c.month &&
      s.day === c.day &&
      c.minutes >= s.startHour * 60 &&
      c.minutes < s.endHour * 60,
  );
}

/** The weekly service running at `now` (Lagos time), if any. */
function findLiveRecurring(now: Date): ScheduledService | undefined {
  const c = lagosClock(now);
  return LIVE_SERVICES.find(
    (s) =>
      s.dayOfWeek === c.dayOfWeek && c.hour >= s.startHour && c.hour < s.endHour,
  );
}

/* ------------------------------------------------------------------ */

/** Returns `true` when the current time falls inside any live window. */
export function isCurrentlyLive(now = new Date()): boolean {
  return !!findLiveSpecial(now) || !!findLiveRecurring(now);
}

/**
 * Returns the start timestamp (Unix ms) of the currently-live service,
 * or `null` if no service is live right now.
 */
export function getCurrentServiceStartTime(now = new Date()): number | null {
  const c = lagosClock(now);

  // Check special services first
  const special = findLiveSpecial(now);
  if (special) {
    return lagosInstant(c.year, c.month, c.day, special.startHour).getTime();
  }

  // Check recurring services
  const recurring = findLiveRecurring(now);
  if (recurring) {
    return lagosInstant(c.year, c.month, c.day, recurring.startHour).getTime();
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
  const c = lagosClock(now);

  let best: { date: Date; label: string } | null = null;

  // --- Check special one-off services ---
  for (const sp of specialServices) {
    const spDate = lagosInstant(sp.year, sp.month, sp.day, sp.startHour);
    if (spDate.getTime() > now.getTime()) {
      if (!best || spDate.getTime() < best.date.getTime()) {
        best = { date: spDate, label: sp.label };
      }
    }
  }

  // --- Check recurring weekly services ---
  for (const service of LIVE_SERVICES) {
    let daysAhead = (service.dayOfWeek - c.dayOfWeek + 7) % 7;

    if (daysAhead === 0 && c.minutes >= service.startHour * 60) {
      daysAhead = 7;
    }

    const candidate = lagosInstant(
      c.year,
      c.month,
      c.day + daysAhead,
      service.startHour,
    );

    if (!best || candidate.getTime() < best.date.getTime()) {
      best = { date: candidate, label: service.label };
    }
  }

  if (!best) {
    best = {
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      label: "Service",
    };
  }

  return {
    date: best.date,
    label: best.label,
    formattedDate: formatServiceDate(best.date),
  };
}

/* ------------------------------------------------------------------ */

/** "Sunday, 01 March" — the date as it falls in Lagos. */
function formatServiceDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS_TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")}, ${part("day")} ${part("month")}`;
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
  const liveSpecial = findLiveSpecial(now);
  if (liveSpecial) return liveSpecial.label;

  const c = lagosClock(now);

  // Build a map from recurring services for meeting titles
  const dayTitles: Record<number, string> = {};
  for (const svc of LIVE_SERVICES) {
    dayTitles[svc.dayOfWeek] = svc.label;
  }

  // ── Find the most recent past SPECIAL service ──
  let mostRecentSpecial: { time: number; label: string } | null = null;
  for (const sp of specialServices) {
    const spEnd = lagosInstant(sp.year, sp.month, sp.day, sp.endHour);
    if (spEnd.getTime() <= now.getTime()) {
      if (!mostRecentSpecial || spEnd.getTime() > mostRecentSpecial.time) {
        mostRecentSpecial = { time: spEnd.getTime(), label: sp.label };
      }
    }
  }

  // ── Find the most recent past REGULAR weekly meeting ──
  let mostRecentRegular: { time: number; label: string } | null = null;
  for (let offset = 0; offset <= 7; offset++) {
    const checkDay = (c.dayOfWeek - offset + 7) % 7;
    if (!dayTitles[checkDay]) continue;

    if (offset === 0) {
      const svc = LIVE_SERVICES.find((s) => s.dayOfWeek === checkDay);
      if (svc) {
        if (c.minutes < svc.startHour * 60) continue;
        const regEnd = lagosInstant(c.year, c.month, c.day, svc.endHour);
        mostRecentRegular = {
          time: Math.min(regEnd.getTime(), now.getTime()),
          label: dayTitles[checkDay],
        };
      }
    } else {
      const svc = LIVE_SERVICES.find((s) => s.dayOfWeek === checkDay);
      const endHour = svc?.endHour ?? 21;
      mostRecentRegular = {
        time: lagosInstant(c.year, c.month, c.day - offset, endHour).getTime(),
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
