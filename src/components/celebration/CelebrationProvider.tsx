"use client";

/**
 * Ribbon-confetti celebration overlay.
 *
 * Self-contained (no confetti dependency — same philosophy as the hand-built
 * admin charts): a single full-viewport <canvas>, pointer-events-none, driven by
 * a small particle engine. Ribbons are thin rounded rectangles that spray out,
 * arc under gravity, tumble and flutter (a per-particle scaleX twist makes them
 * read as ribbons, not squares), then fade.
 *
 * Usage: wrap a subtree in <CelebrationProvider> and call
 *   const { celebrate } = useCelebration();
 *   celebrate({ intensity: "milestone" });   // center burst
 *   celebrate({ intensity: "champion" });     // dual gold side-cannons
 *
 * Honours prefers-reduced-motion by not animating.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

export type CelebrationIntensity = "milestone" | "champion";

interface CelebrateOptions {
  intensity?: CelebrationIntensity;
  /** Short headline naming the achievement, e.g. "New #1!". */
  label?: string;
  /** Optional emoji shown before the label. */
  emoji?: string;
}

interface CelebrationContextValue {
  celebrate: (opts?: CelebrateOptions) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function useCelebration(): CelebrationContextValue {
  const ctx = useContext(CelebrationContext);
  // No-op fallback so a stray call outside the provider never throws.
  return ctx ?? { celebrate: () => {} };
}

// ── Palettes ─────────────────────────────────────────────────────────────────
const FESTIVE = [
  "#FF7C18", // brand orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#ec4899", // pink
  "#a855f7", // violet
];
const GOLD = ["#FFD700", "#FDB931", "#FF7C18", "#f59e0b", "#FFF3B0", "#eab308"];

interface Ribbon {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  len: number;
  wid: number;
  color: string;
  twist: number;
  twistSpeed: number;
  life: number;
  maxLife: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function CelebrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Ribbon[]>([]);
  const rafRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [banner, setBanner] = useState<{
    label: string;
    emoji?: string;
    champion: boolean;
  } | null>(null);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // ── Size the canvas to the viewport (accounting for DPR) ──
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);
    return () => window.removeEventListener("resize", sizeCanvas);
  }, [sizeCanvas]);

  // ── The render loop (runs only while particles are alive) ──
  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);

    const parts = particlesRef.current;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      // physics
      p.vy += 0.14; // gravity
      p.vx *= 0.99; // air drag
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.twist += p.twistSpeed;
      p.life -= 1;

      if (p.life <= 0 || p.y > H + 40) {
        parts.splice(i, 1);
        continue;
      }

      const fade = Math.min(1, p.life / (p.maxLife * 0.35));
      // scaleX from the twist gives the ribbon its fluttering foreshorten.
      const sx = Math.cos(p.twist);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(sx, 1);
      ctx.globalAlpha = fade;
      ctx.fillStyle = p.color;
      const w = p.wid;
      const l = p.len;
      const r = Math.min(2, w / 2);
      // rounded-rect ribbon
      ctx.beginPath();
      ctx.moveTo(-l / 2 + r, -w / 2);
      ctx.arcTo(l / 2, -w / 2, l / 2, w / 2, r);
      ctx.arcTo(l / 2, w / 2, -l / 2, w / 2, r);
      ctx.arcTo(-l / 2, w / 2, -l / 2, -w / 2, r);
      ctx.arcTo(-l / 2, -w / 2, l / 2, -w / 2, r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (parts.length > 0) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, W, H);
      rafRef.current = null;
    }
  }, []);

  const emit = useCallback(
    (
      origin: { x: number; y: number },
      angle: number,
      spread: number,
      count: number,
      power: number,
      palette: string[],
    ) => {
      const parts = particlesRef.current;
      for (let i = 0; i < count; i++) {
        const a = angle + rand(-spread, spread);
        const speed = rand(power * 0.5, power);
        parts.push({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          rot: rand(0, Math.PI * 2),
          vr: rand(-0.3, 0.3),
          len: rand(12, 22),
          wid: rand(5, 9),
          color: palette[(Math.random() * palette.length) | 0],
          twist: rand(0, Math.PI * 2),
          twistSpeed: rand(0.15, 0.35) * (Math.random() < 0.5 ? -1 : 1),
          life: rand(120, 200),
          maxLife: 200,
        });
      }
    },
    [],
  );

  const celebrate = useCallback(
    (opts?: CelebrateOptions) => {
      if (typeof window === "undefined") return;
      const champion = opts?.intensity === "champion";

      // The label naming the achievement shows even under reduced motion — it's
      // information, not decoration. Only the particle spray is motion-gated.
      if (opts?.label) {
        if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
        setBanner({ label: opts.label, emoji: opts.emoji, champion });
        bannerTimerRef.current = setTimeout(
          () => setBanner(null),
          champion ? 4000 : 3000,
        );
      }

      if (reducedRef.current) return;
      sizeCanvas();

      const W = window.innerWidth;
      const H = window.innerHeight;
      const palette = champion ? GOLD : FESTIVE;

      if (champion) {
        // Two upward side-cannons meeting in the middle — the big moment.
        emit({ x: 0, y: H }, -Math.PI / 3, 0.35, 90, 22, palette); // bottom-left → up-right
        emit({ x: W, y: H }, (-2 * Math.PI) / 3, 0.35, 90, 22, palette); // bottom-right → up-left
        emit({ x: W / 2, y: H * 0.3 }, -Math.PI / 2, Math.PI, 40, 14, palette);
      } else {
        // A single celebratory burst from the upper third.
        emit(
          { x: W / 2, y: H * 0.32 },
          -Math.PI / 2,
          Math.PI, // full radial
          70,
          15,
          palette,
        );
      }

      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [emit, sizeCanvas, tick],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999]"
      />

      {/* Achievement banner — names what was achieved. Announced politely to
          assistive tech; never blocks interaction. */}
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.label}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-20 z-[9999] flex justify-center px-4"
          >
            <div
              className={`flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-bold shadow-xl backdrop-blur-md sm:text-base ${
                banner.champion
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-amber-500/30"
                  : "bg-gray-900/90 text-white shadow-black/20"
              }`}
            >
              {banner.emoji && (
                <span className="text-lg leading-none sm:text-xl">
                  {banner.emoji}
                </span>
              )}
              <span>{banner.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CelebrationContext.Provider>
  );
}
