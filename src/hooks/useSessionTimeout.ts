import { useEffect, useRef, useCallback } from "react";
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  checkSession,
  markActivity,
  msUntilIdleTimeout,
} from "@/lib/adminSession";

/**
 * Minimum gap between activity writes. High-frequency events (mousemove,
 * scroll) are collapsed to at most one storage write + reschedule per interval.
 */
const ACTIVITY_WRITE_INTERVAL_MS = 30 * 1000;

/**
 * Idle-timeout enforcement for the admin area.
 *
 * The last-activity timestamp lives in sessionStorage (see `adminSession`), not
 * in this hook's closure. That matters twice over: a reload no longer resets the
 * idle clock, and a tab that was backgrounded — where browsers throttle or defer
 * timers — is re-checked against the wall clock the moment it becomes visible
 * again, rather than trusting a countdown that may never have fired.
 */
export function useSessionTimeout(
  onTimeout: () => void,
  isActive: boolean = true,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastWriteRef = useRef(0);

  // Kept in a ref so the activity listeners don't need re-binding every time the
  // caller passes a new inline callback.
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    timeoutRef.current = null;
    warningTimeoutRef.current = null;
  }, []);

  /** Re-arm both timers against the *stored* deadline. */
  const scheduleFromStore = useCallback(() => {
    clearAllTimeouts();

    const remaining = msUntilIdleTimeout();
    if (remaining <= 0) {
      onTimeoutRef.current();
      return;
    }

    const untilWarning = remaining - IDLE_WARNING_MS;
    if (untilWarning > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        console.warn(
          `Admin session expires in ${Math.round(IDLE_WARNING_MS / 60000)} minutes due to inactivity`,
        );
      }, untilWarning);
    }

    timeoutRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, remaining);
  }, [clearAllTimeouts]);

  const resetTimeout = useCallback(() => {
    markActivity();
    lastWriteRef.current = Date.now();
    scheduleFromStore();
  }, [scheduleFromStore]);

  /**
   * Throttled activity handler.
   *
   * `mousemove` and `scroll` fire at roughly display refresh rate. Doing a
   * synchronous sessionStorage write plus two clearTimeout/setTimeout pairs on
   * every one of those events burns main-thread time for no benefit: against a
   * 30-minute deadline, refreshing more than twice a minute changes nothing.
   *
   * Cost of throttling is bounded and harmless — the stored stamp is at most
   * ACTIVITY_WRITE_INTERVAL_MS stale, so the session can expire up to 30s early
   * in the worst case, never late.
   */
  const handleActivityThrottled = useCallback(() => {
    const now = Date.now();
    if (now - lastWriteRef.current < ACTIVITY_WRITE_INTERVAL_MS) return;
    resetTimeout();
  }, [resetTimeout]);

  useEffect(() => {
    if (!isActive) {
      clearAllTimeouts();
      return;
    }

    // Arm against whatever is already stored — do NOT stamp fresh activity here,
    // or simply mounting the layout would forgive an expired idle period.
    scheduleFromStore();

    const handleActivity = handleActivityThrottled;

    // A throttled background tab can miss its timer entirely; re-validate
    // against the wall clock whenever the tab comes back to the foreground.
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!checkSession().ok) {
        onTimeoutRef.current();
        return;
      }
      scheduleFromStore();
    };

    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "mousemove",
    ];

    // passive: these never call preventDefault, so the browser can keep
    // scrolling on the compositor instead of waiting on the handler.
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearAllTimeouts();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [isActive, handleActivityThrottled, scheduleFromStore, clearAllTimeouts]);

  return { clearTimeout: clearAllTimeouts, resetTimeout, IDLE_TIMEOUT_MS };
}
