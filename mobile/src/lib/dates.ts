const LAGOS = "Africa/Lagos";

/** "Sunday, 9 November 2026" in Lagos time (the church's time zone). */
export function formatLongDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: LAGOS,
    });
  } catch {
    return d.toDateString();
  }
}

/** "9 Nov 2026" */
export function formatShortDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: LAGOS });
  } catch {
    return d.toDateString();
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Compact event date: "2026-11-04" → "4 Nov'26" (gallery dates).
 * Parsed from the string, not via Date, so time zones can't shift the day.
 * Anything not in YYYY-MM-DD form is returned unchanged.
 */
export function formatCompactDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd;
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return ymd;
  return `${Number(m[3])} ${month}'${m[1].slice(2)}`;
}

/** Morning / afternoon / evening greeting in Lagos time. */
export function greeting(now = new Date()): string {
  let hour = now.getHours();
  try {
    hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: LAGOS }).format(now));
  } catch {
    /* fall back to device time */
  }
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** 93784 s → { d: 1, h: 2, m: 3, s: 4 } */
export function splitDuration(totalSeconds: number) {
  const t = Math.max(0, Math.floor(totalSeconds));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}
