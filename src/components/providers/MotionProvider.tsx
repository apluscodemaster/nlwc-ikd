"use client";

import { LazyMotion } from "framer-motion";

const loadFeatures = () =>
  import("@/lib/motionFeatures").then((mod) => mod.default);

/**
 * Lazy-loads Framer Motion's animation engine.
 *
 * Every component imports Framer's lightweight `m` element under the usual
 * name (`import { m as motion } from "framer-motion"`), so its JSX is
 * unchanged, but the full `motion` runtime no longer ships in every page's
 * initial JavaScript. The engine arrives as a separate chunk right after the
 * page renders, and animations start then.
 *
 * Must wrap everything that animates — an `m` element outside it never
 * animates (and would stay in its `initial` state). Mounted around the whole
 * <body> content in the root layout.
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
