"use client";

import { useEffect, type RefObject } from "react";

/** Where to scroll: a ref, or a resolver so the target can depend on viewport. */
export type AutoScrollTarget =
  | RefObject<HTMLElement | null>
  | (() => HTMLElement | null);

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
 * Bring a target into view once on mount — used by the streaming pages so a
 * visitor lands straight on the player instead of scrolling past the hero.
 *
 * `scrollIntoView` honours the element's `scroll-margin-top`, so give the
 * target a `scroll-mt-*` class to clear the fixed navbar. Respects
 * `prefers-reduced-motion` (jumps instead of gliding) and stays out of the
 * way when the URL already carries a `#hash` the browser is scrolling to.
 *
 * Pass a resolver function when the right target depends on the viewport
 * (e.g. the whole player card on desktop, but the embed itself on a phone,
 * where the card's header would otherwise fill the screen).
 */
export function useAutoScrollTo(
  target: AutoScrollTarget,
  { delay = 450, enabled = true }: AutoScrollOptions = {},
) {
  useEffect(() => {
    if (!enabled) return;
    if (window.location.hash) return;

    const timeout = setTimeout(() => {
      const el = typeof target === "function" ? target() : target.current;
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
