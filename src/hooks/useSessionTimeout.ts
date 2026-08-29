import { useEffect, useRef, useCallback } from "react";
import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  checkSession,
  markActivity,
  msUntilIdleTimeout,
} from "@/lib/adminSession";

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
    scheduleFromStore();
  }, [scheduleFromStore]);

  useEffect(() => {
    if (!isActive) {
      clearAllTimeouts();
      return;
    }

    // Arm against whatever is already stored — do NOT stamp fresh activity here,
    // or simply mounting the layout would forgive an expired idle period.
    scheduleFromStore();

    const handleActivity = () => {
      resetTimeout();
    };

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

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
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
  }, [isActive, resetTimeout, scheduleFromStore, clearAllTimeouts]);

  return { clearTimeout: clearAllTimeouts, resetTimeout, IDLE_TIMEOUT_MS };
}
