"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard and screen-reader behaviour for a dialog or pop-up:
 *
 * - Escape closes it.
 * - modal: focus moves into the dialog when it opens, Tab / Shift+Tab stay
 *   inside it, and focus returns to whatever had it before when it closes.
 *   Non-modal pop-ups (corner cards, the walking banner) only get Escape, so
 *   they never steal focus from the page someone is reading.
 *
 * Put the returned ref on the dialog panel (the element with role="dialog").
 * Focus starts on an element marked data-autofocus, else the first
 * focusable one.
 */
export function useDialogA11y<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
  { modal = true }: { modal?: boolean } = {},
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  // The latest onClose without re-running the effect (callers often pass an
  // inline function).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (modal) {
      // After the open animation has mounted the panel.
      requestAnimationFrame(() => {
        const panel = ref.current;
        if (!panel || panel.contains(document.activeElement)) return;
        const first =
          panel.querySelector<HTMLElement>("[data-autofocus]") ??
          panel.querySelector<HTMLElement>(FOCUSABLE);
        if (first) first.focus();
        else {
          panel.tabIndex = -1;
          panel.focus();
        }
      });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (!modal || e.key !== "Tab" || !ref.current) return;
      const items = Array.from(
        ref.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter(
        (el) =>
          !el.closest("[hidden], [inert]") &&
          // Skips display:none / visibility:hidden (where supported).
          (typeof el.checkVisibility !== "function" ||
            el.checkVisibility({ visibilityProperty: true }) ||
            el === document.activeElement),
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !ref.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !ref.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (modal && previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [open, modal]);

  return ref;
}
