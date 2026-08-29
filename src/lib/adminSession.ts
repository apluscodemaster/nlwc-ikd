/**
 * Admin tab-session enforcement.
 *
 * The bug this exists to close: Firebase Auth defaults to
 * `browserLocalPersistence`, which parks the credential in localStorage where it
 * survives closing the tab, closing the browser, and rebooting — indefinitely.
 * The old idle timeout was a bare `setTimeout` living in the page's JS heap, so
 * it died with the tab and was never enforced across a restart. Net effect: an
 * admin could close the tab, come back days later, and land straight in the
 * dashboard with no credentials. That is the behaviour being fixed.
 *
 * Two independent guards, both keyed off sessionStorage (which the browser
 * clears when the tab closes — that is the whole point):
 *
 *   1. TAB MARKER — written only by an actual sign-in in THIS tab. If Firebase
 *      hands us a restored user and the marker is absent, that credential came
 *      from persistent storage rather than a login, so it is rejected. This
 *      holds even if Firebase's persistence setting is changed or its migration
 *      behaviour differs between SDK versions.
 *
 *   2. IDLE DEADLINE — last-activity timestamp written to storage rather than
 *      kept in memory, so a reload cannot silently reset the idle clock.
 *
 * All functions are pure with respect to `now` and degrade to "expired" when
 * storage is unavailable (private mode, disabled cookies) — failing closed.
 */

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const IDLE_WARNING_MS = 5 * 60 * 1000; // warn 5 minutes before

const MARKER_KEY = "nlwc-admin-tab-session";
const ACTIVITY_KEY = "nlwc-admin-last-activity";

export type SessionRejection = "no-tab-session" | "idle-expired";

export type SessionCheck =
  | { ok: true; idleMs: number }
  | { ok: false; reason: SessionRejection };

/** sessionStorage, or null when unavailable (SSR, private mode, blocked). */
function store(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Record that a real sign-in happened in this tab. */
export function beginTabSession(now: number = Date.now()): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(MARKER_KEY, String(now));
    s.setItem(ACTIVITY_KEY, String(now));
  } catch {
    // Storage full or blocked — the session check will fail closed.
  }
}

/** Clear the tab session (sign-out, or an expiry we just enforced). */
export function endTabSession(): void {
  const s = store();
  if (!s) return;
  try {
    s.removeItem(MARKER_KEY);
    s.removeItem(ACTIVITY_KEY);
  } catch {
    // Nothing to do — absence is what we wanted anyway.
  }
}

/** Refresh the idle deadline. Cheap enough to call on every input event. */
export function markActivity(now: number = Date.now()): void {
  const s = store();
  if (!s) return;
  try {
    if (s.getItem(MARKER_KEY) === null) return; // no live session to extend
    s.setItem(ACTIVITY_KEY, String(now));
  } catch {
    // ignore
  }
}

/** Milliseconds since the last recorded activity, or null if unknown. */
export function getIdleMs(now: number = Date.now()): number | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(ACTIVITY_KEY);
    if (raw === null) return null;
    const last = Number(raw);
    if (!Number.isFinite(last)) return null;
    // A clock shifted backwards (NTP correction, timezone change, tampering)
    // would otherwise yield a negative idle time and look like fresh activity.
    return Math.max(0, now - last);
  } catch {
    return null;
  }
}

/**
 * Decide whether a Firebase-restored user may keep their session.
 *
 * Call this whenever `onAuthStateChanged` reports a user, and again when the
 * tab regains visibility — a backgrounded tab's timers are throttled, so the
 * in-memory countdown alone cannot be trusted to have fired.
 */
export function checkSession(now: number = Date.now()): SessionCheck {
  const s = store();
  if (!s) return { ok: false, reason: "no-tab-session" };

  let marker: string | null;
  try {
    marker = s.getItem(MARKER_KEY);
  } catch {
    return { ok: false, reason: "no-tab-session" };
  }

  // Restored from persistent storage rather than signed in here.
  if (marker === null) return { ok: false, reason: "no-tab-session" };

  const idleMs = getIdleMs(now);
  if (idleMs === null) return { ok: false, reason: "idle-expired" };
  if (idleMs >= IDLE_TIMEOUT_MS) return { ok: false, reason: "idle-expired" };

  return { ok: true, idleMs };
}

/** Milliseconds until the idle deadline; 0 once expired. */
export function msUntilIdleTimeout(now: number = Date.now()): number {
  const idleMs = getIdleMs(now);
  if (idleMs === null) return 0;
  return Math.max(0, IDLE_TIMEOUT_MS - idleMs);
}
