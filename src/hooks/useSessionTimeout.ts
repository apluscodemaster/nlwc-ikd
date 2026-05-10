import { useEffect, useRef, useCallback } from 'react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before timeout

export function useSessionTimeout(onTimeout: () => void, isActive: boolean = true) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
  }, []);

  const resetTimeout = useCallback(() => {
    clearAllTimeouts();
    lastActivityRef.current = Date.now();

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      // You can dispatch a warning event here if needed
      console.warn('Session will expire in 5 minutes due to inactivity');
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, INACTIVITY_TIMEOUT);
  }, [clearAllTimeouts, onTimeout]);

  useEffect(() => {
    if (!isActive) return;

    resetTimeout();

    // Track user activity
    const handleActivity = () => {
      resetTimeout();
    };

    const events = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'mousemove',
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      clearAllTimeouts();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive, resetTimeout, clearAllTimeouts]);

  return { clearTimeout: clearAllTimeouts, resetTimeout };
}
