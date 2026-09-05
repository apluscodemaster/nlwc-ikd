/**
 * Publish-time rules for Sunday School manuals.
 *
 * Manuals are scheduled by DATE only — the admin form has no hour/minute
 * picker — so the time comes from here rather than from the editor.
 */

/**
 * Wall-clock time a scheduled manual goes live on its chosen date.
 *
 * Half past midnight rather than midnight on purpose: WordPress publishes
 * scheduled posts from wp-cron, which fires on incoming traffic rather than on
 * a real timer, so a post dated exactly 00:00 can sit unpublished until the
 * first visitor of the day. The 30-minute margin absorbs that, and the lesson
 * is still live many hours before Sunday morning.
 */
export const MANUAL_RELEASE_TIME = "00:30:00";

/**
 * The naive site-local `date` a manual should be saved with.
 *
 * @param date        YYYY-MM-DD chosen in the admin date picker.
 * @param originalIso The manual's current WordPress timestamp, if it has one.
 * @param now         Injected for tests; defaults to the current time.
 *
 * A date whose release slot is still ahead of us means the admin is
 * scheduling, so the slot applies. Otherwise the manual is already out and its
 * existing publish time is preserved to the second — editing a live lesson's
 * title or body must never move when it went out. The slot is the fallback
 * only when there is no previous timestamp to keep, i.e. a brand-new manual.
 */
export function manualPublishDateTime(
  date: string,
  originalIso?: string,
  now: number = Date.now(),
): string | null {
  if (!date) return null;

  const releaseAt = `${date}T${MANUAL_RELEASE_TIME}`;
  if (new Date(releaseAt).getTime() > now) return releaseAt;

  // Read the stored wall-clock time literally. WordPress timestamps are naive
  // site-local with no offset, so `new Date(...)` would re-interpret them in
  // the browser's zone and shift the hour.
  const existing = /T(\d{2}:\d{2}:\d{2})/.exec(originalIso ?? "");
  return existing ? `${date}T${existing[1]}` : releaseAt;
}
