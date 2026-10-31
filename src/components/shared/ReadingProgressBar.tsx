"use client";

import React, { useEffect, useRef } from "react";

/**
 * Thin reading-progress bar for long articles.
 *
 * Updated directly on the DOM, at most once per animation frame, with a
 * `transform` (GPU-composited) rather than React state + `width`: the old
 * version re-rendered and re-laid-out the page on every scroll event.
 */
export default function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        docHeight <= 0 ? 0 : Math.min(1, window.scrollY / docHeight);
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }
    }

    function handleScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    update(); // initial
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-100 h-1 bg-transparent pointer-events-none">
      <div
        ref={barRef}
        className="h-full origin-left bg-linear-to-r from-amber-500 to-orange-500 will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
