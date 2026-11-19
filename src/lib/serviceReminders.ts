import type { NextServiceInfo } from "@/lib/liveSchedule";

/** Reminders go out this long before a service starts. */
export const REMIND_BEFORE_MS = 30 * 60 * 1000;
/**
 * Extra room for the job's schedule: it runs every 10 minutes (often a few
 * minutes late), so the first run inside the window sends the reminder.
 */
const WINDOW_SLACK_MS = 10 * 60 * 1000;

export interface Reminder {
  /** One reminder per service start (dedupe key). */
  key: string;
  title: string;
  body: string;
  url: string;
}

function lagosTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
}

/** The reminder due at `now` for the next service, if it starts soon. */
export function dueReminder(now: Date, next: NextServiceInfo | null): Reminder | null {
  if (!next || Number.isNaN(next.date.getTime())) return null;
  const until = next.date.getTime() - now.getTime();
  if (until <= 0 || until > REMIND_BEFORE_MS + WINDOW_SLACK_MS) return null;
  const minutes = Math.max(1, Math.round(until / 60_000));
  return {
    key: next.date.toISOString(),
    title: `${next.label} starts ${minutes <= 5 ? "now" : `in ${minutes} minutes`}`,
    body: `${lagosTime(next.date)} Lagos time. Tap to join the live stream and chat.`,
    url: "/live",
  };
}
