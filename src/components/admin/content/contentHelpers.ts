/**
 * Pure helpers for the Church Content admin — kept free of React so they can
 * be unit-tested and reused by the create forms and the edit modal alike.
 */

export const pad2 = (n: number | string) => String(n).padStart(2, "0");

/** Today's date as a YYYY-MM-DD picker value, in LOCAL calendar parts. */
export function todayInputValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** Convert any date string (a formatted label like "January 5, 2025" or an ISO
 *  string) to a YYYY-MM-DD value for the date picker, using LOCAL calendar
 *  parts so the day never shifts by one (toISOString would convert to UTC). */
export function toDateInputValue(value?: string): string {
  if (!value) return "";
  // A naive WordPress timestamp ("2026-07-28T00:15:00") carries no zone; take
  // its calendar parts literally instead of letting Date reinterpret them.
  const naive = /^(\d{4}-\d{2}-\d{2})T/.exec(value);
  if (naive) return naive[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// The "Minister:" line helpers moved to utils/speakerLine once the public
// audio message page needed them too. Re-exported here so the admin keeps a
// single import for its content helpers.
export {
  stripLeadingSpeakerLine,
  withSpeakerLine,
} from "@/utils/speakerLine";
