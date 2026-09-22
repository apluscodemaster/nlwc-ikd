"use client";

import { useEffect, type RefObject } from "react";

interface AutoScrollOptions {
  /**
   * Milliseconds to wait before scrolling. Long enough for Next.js scroll
   * restoration and the page's entrance animations to settle, short enough
   * that the move still reads as part of the page loading rather than a
   * surprise jump.
   */
  delay?: number;
  /** Set false to skip (e.g. the target isn't rendered yet). */
  enabled?: boolean;
}

/**
 * Bring `ref` into view once on mount — used by the streaming pages so a
 * visitor lands straight on the player instead of scrolling past the hero.
 *
 * Works the same on phones and desktops: `scrollIntoView` honours the
 * element's `scroll-margin-top`, so give the target a `scroll-mt-*` class to
 * clear the fixed navbar. Respects `prefers-reduced-motion` (jumps instead of
 * gliding) and stays out of the way when the URL already carries a `#hash`
 * that the browser is scrolling to.
 */
export function useAutoScrollTo(
  ref: RefObject<HTMLElement | null>,
  { delay = 450, enabled = true }: AutoScrollOptions = {},
) {
  useEffect(() => {
    if (!enabled) return;
    if (window.location.hash) return;

    const timeout = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, delay);

    return () => clearTimeout(timeout);
    // Mount-only by design: re-running on every render would yank the page
    // back to the player each time playback state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
