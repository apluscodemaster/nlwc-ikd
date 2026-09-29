"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Single-line text that slides into view when it is too wide for its container.
 *
 * Player titles are the motivating case: on a phone a long message title is cut
 * off by `truncate` and there is no way to read the rest. This keeps the
 * ellipsis behaviour whenever the text fits (or the player is idle) and only
 * animates when there is genuinely something hidden.
 *
 * The cycle deliberately pauses at both ends rather than scrolling
 * continuously — text that never stops moving is hard to read and draws the eye
 * away from the controls. It waits, sweeps left, waits, sweeps back, and
 * repeats for as long as `active` stays true.
 */
export function MarqueeText({
  text,
  /** Usually "is the audio playing" — a paused player holds still. */
  active = true,
  className,
  /** Pixels per second for the sweep. Lower reads calmer. */
  speed = 40,
  /** Ignore overflow smaller than this (sub-pixel rounding, a clipped comma). */
  threshold = 6,
}: {
  text: string;
  active?: boolean;
  className?: string;
  speed?: number;
  threshold?: number;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const inner = textRef.current;
    if (!container || !inner) return;
    // scrollWidth of the inner span is the text's natural width; the container
    // is what clips it.
    setOverflow(Math.max(0, inner.scrollWidth - container.clientWidth));
  }, []);

  // Re-measure when the text changes (next track) and whenever the container
  // resizes (rotation, the bar growing on expand, a font finally loading).
  useEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure, text]);

  const shouldAnimate = active && !reduceMotion && overflow > threshold;

  // Hold, sweep, hold, sweep back — see the keyframes in globals.css. The
  // sweeps occupy 70% of the cycle, so scale the duration by the distance to
  // keep the apparent speed constant regardless of title length.
  const duration = shouldAnimate
    ? Math.max(6, overflow / (speed * 0.35) + 2.5)
    : 0;

  return (
    <span
      ref={containerRef}
      // `title` keeps the full text reachable on pointer devices, and the text
      // node itself is complete in the DOM for screen readers either way.
      title={text}
      className={cn("block overflow-hidden whitespace-nowrap", className)}
    >
      <span
        ref={textRef}
        className={cn(
          "inline-block max-w-full align-bottom",
          shouldAnimate
            ? "animate-marquee-sweep will-change-transform"
            : // Not animating: behave exactly like the plain `truncate` this
              // replaces, so idle players look unchanged.
              "overflow-hidden text-ellipsis",
        )}
        style={
          shouldAnimate
            ? ({
                "--marquee-shift": `-${overflow}px`,
                animationDuration: `${duration}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
}

export default MarqueeText;
