"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import React from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  Pause,
  Play,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const fetcher = () =>
  fetch("/api/autoscroll-gallery").then((res) => res.json());

/* ────────────────────────────────────────────────────────────────────────────
 * Image sizing
 *
 * The API hands back *bare* lh3.googleusercontent.com URLs. Without an explicit
 * `=wN` parameter Google serves a small default rendition (~512px), which is
 * why the old fixed-size cards looked soft — the browser was upscaling. We ask
 * for a rendition comfortably larger than the card is ever drawn at.
 * ──────────────────────────────────────────────────────────────────────────── */
const LH3 = "lh3.googleusercontent.com";
const CARD_RENDITION = 1400;
const FULL_RENDITION = 2048;

function sizedGoogleImage(url: string, width: number) {
  if (!url.includes(LH3)) return url;
  // Drop any size suffix Google (or an earlier resolve step) already appended,
  // e.g. `=w600-h315-p-k`, before adding our own.
  const base = url.replace(/=[whspkno\d\-]+$/, "");
  return `${base}=w${width}`;
}

function originalGoogleImage(url: string) {
  if (!url.includes(LH3)) return url;
  return `${url.replace(/=[whspkno\d\-]+$/, "")}=s0`;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Stage geometry
 * ──────────────────────────────────────────────────────────────────────────── */
const VISIBLE = 3; // cards shown on each side of the focused one
const PRELOAD = 4; // mounted (but transparent) so they are warm on arrival
const AUTOPLAY_MS = 4200;
const DEFAULT_RATIO = 3 / 2;
const STEP_ROTATION = 42;

/**
 * Every dimension below is derived from the measured stage width rather than a
 * media query, so the carousel stays proportional at any viewport — including
 * the awkward sizes between breakpoints.
 */
function stageMetrics(stageWidth: number) {
  const compact = stageWidth < 480;
  return {
    baseHeight:
      stageWidth < 480
        ? 250
        : stageWidth < 768
          ? 330
          : stageWidth < 1280
            ? 420
            : 480,
    // A shallower perspective on narrow screens keeps the angled cards from
    // stretching into unreadable slivers.
    perspective: Math.round(Math.max(1000, Math.min(stageWidth * 1.5, 2000))),
    stepZ: compact ? 110 : 180,
    // Fraction of the stage width a card may occupy before it is shortened
    // instead of cropped.
    widthCap: Math.min(stageWidth * (compact ? 0.86 : 0.92), 760),
  };
}

/** Signed distance from `active` to `i`, wrapping the short way around. */
function relativeIndex(i: number, active: number, count: number) {
  let d = i - active;
  const half = count / 2;
  if (d > half) d -= count;
  else if (d < -half) d += count;
  return d;
}

// Measure before paint on the client so the stage never flashes at the wrong
// size, while staying SSR-safe.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function useStageWidth() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────────── */
export default function AutoScrollGallery() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["autoscroll-gallery"],
    queryFn: fetcher,
    refetchInterval: 1000 * 60 * 5,
  });

  const images: string[] = React.useMemo(() => data?.images || [], [data]);
  const count = images.length;

  const [stageRef, stageWidth] = useStageWidth();
  const reducedMotion = usePrefersReducedMotion();

  const [active, setActive] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [hovering, setHovering] = React.useState(false);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const [dragX, setDragX] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  // Natural aspect ratios, keyed by URL and learned from the images we already
  // render — no extra probing requests.
  const [ratios, setRatios] = React.useState<Record<string, number>>({});

  const dragStart = React.useRef<number | null>(null);
  const dragged = React.useRef(false);

  const step = React.useCallback(
    (delta: number) => {
      if (count === 0) return;
      setActive((prev) => (prev + delta + count) % count);
    },
    [count],
  );

  // Keep the focused index valid when the sheet gains or loses rows.
  React.useEffect(() => {
    setActive((prev) => (count === 0 ? 0 : Math.min(prev, count - 1)));
  }, [count]);

  const autoplayOn =
    playing &&
    !hovering &&
    !dragging &&
    !lightbox &&
    !reducedMotion &&
    count > 1;

  React.useEffect(() => {
    if (!autoplayOn) return;
    const id = setInterval(() => step(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplayOn, step]);

  const onLoadRatio = React.useCallback(
    (url: string, img: HTMLImageElement) => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const ratio = img.naturalWidth / img.naturalHeight;
      setRatios((prev) =>
        prev[url] === ratio ? prev : { ...prev, [url]: ratio },
      );
    },
    [],
  );

  /* ── Geometry ─────────────────────────────────────────────────────────── */
  const measuredWidth = stageWidth || 1280;
  const { baseHeight, perspective, stepZ, widthCap } =
    stageMetrics(measuredWidth);
  const reflectionSpace = Math.round(baseHeight * 0.4);

  const sizeFor = React.useCallback(
    (url: string) => {
      const ratio = ratios[url] ?? DEFAULT_RATIO;
      // Very wide panoramas get shorter rather than cropped: every card keeps
      // its true aspect ratio, and they all sit on the same floor line.
      const height = Math.min(baseHeight, widthCap / ratio);
      return { width: height * ratio, height };
    },
    [ratios, baseHeight, widthCap],
  );

  // The gap between cards follows the focused card's real width, so a portrait
  // shot pulls its neighbours in and a panorama pushes them out.
  const activeWidth = count > 0 ? sizeFor(images[active]).width : baseHeight;
  const stepX = activeWidth * 0.55 + Math.min(measuredWidth * 0.05, 44);

  /* ── Pointer drag ─────────────────────────────────────────────────────── */
  const onPointerDown = (e: React.PointerEvent) => {
    if (count < 2) return;
    dragStart.current = e.clientX;
    dragged.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    if (Math.abs(dx) > 6) dragged.current = true;
    setDragX(Math.max(-140, Math.min(140, dx)) * 0.35);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    dragStart.current = null;
    setDragging(false);
    setDragX(0);
    if (Math.abs(dx) > 55) step(dx < 0 ? 1 : -1);
  };

  const onCardActivate = (index: number, distance: number) => {
    if (dragged.current) return;
    if (distance === 0) setLightbox(images[index]);
    else step(distance);
  };

  /* ── States ───────────────────────────────────────────────────────────── */
  if (isError) {
    return (
      <section className="bg-[#0b0b0f] py-24">
        <div className="mx-auto max-w-md rounded-[40px] border border-white/10 bg-white/5 px-8 py-14 text-center text-white/60">
          We encountered an issue loading the collection archive.
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="bg-[#0b0b0f] py-24 md:py-32">
        <div className="mx-auto max-w-7xl space-y-4 px-6 text-center">
          <Skeleton className="mx-auto h-4 w-40 bg-white/10" />
          <Skeleton className="mx-auto h-12 w-3/4 rounded-2xl bg-white/10" />
        </div>
        <div className="mt-14 flex items-end justify-center gap-3 overflow-hidden px-4 sm:gap-6 md:mt-20">
          {[0.6, 0.8, 1, 0.8, 0.6].map((scale, i) => (
            <Skeleton
              key={i}
              className={cn(
                "aspect-[3/2] shrink-0 rounded-[18px] bg-white/10 md:rounded-[26px]",
                // Only the focused card is guaranteed on-screen at phone widths.
                i === 2 ? "block" : i === 1 || i === 3 ? "hidden sm:block" : "hidden lg:block",
              )}
              style={{
                height: `clamp(${150 * scale}px, ${22 * scale}vw, ${480 * scale}px)`,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#0b0b0f] py-24 md:py-32">
      {/* Ambient light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_45%_at_50%_0%,rgba(255,124,24,0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_35%_at_50%_100%,rgba(255,255,255,0.06),transparent_70%)]"
      />
      {/* Hand back to the white page gap above the footer without a hard seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent to-white md:h-28"
      />

      <div className="relative mx-auto mb-14 max-w-7xl space-y-4 px-6 text-center md:mb-20">
        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary md:text-sm">
          — VIRTUAL ARCHIVE
        </h4>
        <h3 className="mx-auto max-w-4xl text-3xl font-black leading-[1.1] text-white md:text-6xl">
          Relive the <span className="italic text-primary">Soul-Stirring</span>{" "}
          Moments
        </h3>
        <p className="mx-auto max-w-2xl text-base font-medium text-white/50 md:text-lg">
          Step through the gallery — drag, swipe or use the arrow keys to move
          between memories from the Season of The Spirit &apos;26.
        </p>
      </div>

      {count === 0 ? (
        <div className="relative mx-auto max-w-md rounded-[40px] border border-dashed border-white/15 px-8 py-16 text-center">
          <Camera className="mx-auto mb-5 h-12 w-12 text-white/20" />
          <p className="font-medium text-white/50">
            The archive is being curated. Check back shortly.
          </p>
        </div>
      ) : (
        <div ref={stageRef} className="relative">
          {/* 3D stage */}
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label="Three-dimensional photo gallery"
            tabIndex={0}
            className="relative touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            style={{
              perspective: `${perspective}px`,
              height: baseHeight + reflectionSpace,
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onFocus={() => setHovering(true)}
            onBlur={() => setHovering(false)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                step(1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                step(-1);
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLightbox(images[active]);
              }
            }}
          >
            {images.map((url, i) => {
              const distance = relativeIndex(i, active, count);
              const depth = Math.abs(distance);
              if (depth > PRELOAD) return null;

              const { width, height } = sizeFor(url);
              const direction = Math.sign(distance);
              const x =
                direction * (stepX + (depth - 1) * stepX * 0.55) || 0;
              const opacity =
                depth === 0
                  ? 1
                  : depth === 1
                    ? 0.9
                    : depth === 2
                      ? 0.6
                      : depth === 3
                        ? 0.28
                        : 0;

              return (
                <button
                  key={url}
                  type="button"
                  aria-label={
                    depth === 0
                      ? `Open image ${i + 1} of ${count} full screen`
                      : `Show image ${i + 1} of ${count}`
                  }
                  aria-hidden={depth > VISIBLE}
                  tabIndex={-1}
                  onClick={() => onCardActivate(i, distance)}
                  className={cn(
                    "group absolute left-1/2 block cursor-pointer",
                    depth > VISIBLE && "pointer-events-none",
                  )}
                  style={{
                    bottom: reflectionSpace,
                    width,
                    height,
                    opacity,
                    zIndex: 50 - depth,
                    transformOrigin: "bottom center",
                    transform: [
                      `translateX(-50%)`,
                      `translateX(${x + dragX}px)`,
                      `translateZ(${-depth * stepZ}px)`,
                      `rotateY(${direction * STEP_ROTATION}deg)`,
                      `scale(${1 - depth * 0.05})`,
                    ].join(" "),
                    transition: reducedMotion
                      ? "none"
                      : dragging
                        ? // Track the finger 1:1 while dragging, then ease back.
                          "opacity 700ms ease"
                        : "transform 900ms cubic-bezier(0.16,1,0.3,1), opacity 700ms ease, width 500ms ease, height 500ms ease",
                  }}
                >
                  {/* The photo */}
                  <div
                    className={cn(
                      "relative h-full w-full overflow-hidden rounded-[18px] md:rounded-[26px]",
                      "shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10",
                    )}
                  >
                    <Image
                      src={sizedGoogleImage(url, CARD_RENDITION)}
                      alt={`Gallery memory ${i + 1} of ${count}`}
                      fill
                      draggable={false}
                      sizes="(max-width: 768px) 92vw, 760px"
                      className="object-cover"
                      onLoad={(e) => onLoadRatio(url, e.currentTarget)}
                      ref={(img) => {
                        if (img?.complete) onLoadRatio(url, img);
                      }}
                      unoptimized
                      priority={depth === 0}
                    />

                    {/* Glass sheen — strongest on the angled side cards */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 transition-opacity duration-700"
                      style={{
                        opacity: depth === 0 ? 0 : Math.min(depth * 0.22, 0.6),
                        background:
                          direction > 0
                            ? "linear-gradient(to left, rgba(0,0,0,0.85), transparent 65%)"
                            : "linear-gradient(to right, rgba(0,0,0,0.85), transparent 65%)",
                      }}
                    />

                    {depth === 0 && (
                      <span className="pointer-events-none absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-white/25 sm:bottom-4 sm:right-4 sm:h-11 sm:w-11">
                        <Expand className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    )}
                  </div>

                  {/* Floor reflection */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-full h-2/5 overflow-hidden rounded-t-[18px] md:rounded-t-[26px]"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0.32), transparent 72%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0.32), transparent 72%)",
                    }}
                  >
                    <div className="absolute inset-x-0 top-0 h-[250%] -scale-y-100">
                      <Image
                        src={sizedGoogleImage(url, CARD_RENDITION)}
                        alt=""
                        fill
                        draggable={false}
                        sizes="(max-width: 768px) 92vw, 760px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Floor line + edge fades sit above the 3D stage */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 z-60 h-px bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.16),transparent)]"
            style={{ bottom: reflectionSpace }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-60 w-8 bg-linear-to-r from-[#0b0b0f] via-[#0b0b0f]/70 to-transparent sm:w-16 md:w-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-60 w-8 bg-linear-to-l from-[#0b0b0f] via-[#0b0b0f]/70 to-transparent sm:w-16 md:w-40"
          />

          {/* Controls */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous image"
                className="absolute left-1 top-1/2 z-70 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/20 active:scale-95 sm:left-3 sm:h-12 sm:w-12 md:left-8 md:h-14 md:w-14"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next image"
                className="absolute right-1 top-1/2 z-70 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/20 active:scale-95 sm:right-3 sm:h-12 sm:w-12 md:right-8 md:h-14 md:w-14"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Counter, progress, playback */}
      {count > 0 && (
        <div className="relative mx-auto mt-12 flex max-w-md items-center gap-3 px-6 sm:gap-5 md:mt-16">
          <span
            aria-live="polite"
            className="shrink-0 text-xs font-black tabular-nums tracking-widest text-white sm:text-sm"
          >
            {String(active + 1).padStart(2, "0")}
          </span>

          <div className="h-px min-w-0 flex-1 bg-white/15">
            <div
              className="h-px bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${((active + 1) / count) * 100}%` }}
            />
          </div>

          <span className="shrink-0 text-right text-xs font-black tabular-nums tracking-widest text-white/40 sm:text-sm">
            {String(count).padStart(2, "0")}
          </span>

          {count > 1 && (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/15 sm:h-10 sm:w-10"
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Full-screen view */}
      <Dialog
        open={Boolean(lightbox)}
        onOpenChange={(open) => !open && setLightbox(null)}
      >
        <DialogContent className="max-h-[95vh] max-w-[95vw] border-none bg-black/95 p-0 shadow-2xl backdrop-blur-2xl">
          <VisuallyHidden>
            <DialogTitle>Gallery image preview</DialogTitle>
            <DialogDescription>
              High resolution preview. Use the download button to save the
              full resolution version.
            </DialogDescription>
          </VisuallyHidden>
          <div className="relative flex h-[92vh] w-full items-center justify-center p-3 sm:h-[95vh] sm:p-4">
            {lightbox && (
              <>
                <Image
                  src={sizedGoogleImage(lightbox, FULL_RENDITION)}
                  alt="Full resolution gallery image"
                  width={1920}
                  height={1280}
                  className="max-h-[calc(100%-4.5rem)] w-auto max-w-full rounded-xl object-contain shadow-2xl duration-500 animate-in zoom-in-95 sm:max-h-[calc(100%-5.5rem)]"
                  unoptimized
                />

                <div className="absolute bottom-4 left-1/2 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 sm:bottom-8 sm:w-auto">
                  <Button
                    asChild
                    variant="secondary"
                    size="lg"
                    className="h-12 w-full gap-2 rounded-full border border-white/20 bg-white/10 px-6 text-sm font-bold text-white shadow-2xl backdrop-blur-xl transition-all hover:bg-white/20 active:scale-95 sm:h-14 sm:w-auto sm:gap-3 sm:px-8 sm:text-base"
                  >
                    <a
                      href={originalGoogleImage(lightbox)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Save High Resolution Image</span>
                    </a>
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
