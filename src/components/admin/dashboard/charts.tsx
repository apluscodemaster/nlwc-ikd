"use client";

/**
 * Self-contained inline-SVG chart primitives for the admin dashboard.
 *
 * No charting dependency — every mark is drawn by hand so the bundle stays
 * light and the visuals match the rest of the admin (white cards, orange
 * brand accent). Design follows the data-viz mark specs: thin marks with
 * 4px-rounded data-ends squared at the baseline, a 2px surface gap between
 * touching fills, recessive hairline grid/axes, legends for ≥2 series, and
 * selective direct value labels (which also satisfy the contrast-relief rule
 * for the lighter categorical hues).
 */

import React, { useEffect, useRef, useState } from "react";

// ── Palette (validated categorical set + fixed status colors) ────────────────
export const SERIES = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
] as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

// Text / chrome tokens (light surface — the admin is light-mode only)
const INK = "#0b0b0b";
const INK2 = "#52514e";
const MUTED = "#898781";
const GRID = "#e1e0d9";
const BASELINE = "#c3c2b7";
const SURFACE = "#ffffff";

// ── compact number formatter ─────────────────────────────────────────────────
export function compact(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + "K";
  return String(Math.round(n));
}

const nf = (n: number) => n.toLocaleString();

// ── container-width hook (keeps SVG text crisp instead of scaling it) ─────────
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width ?? 0;
      setW(cw);
    });
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

// ── tooltip primitive ────────────────────────────────────────────────────────
interface Tip {
  x: number;
  y: number;
  title: string;
  value: string;
  color?: string;
}

function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900/95 px-2.5 py-1.5 text-[11px] leading-tight text-white shadow-lg"
      style={{ left: tip.x, top: tip.y - 8 }}
    >
      <div className="flex items-center gap-1.5">
        {tip.color && (
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: tip.color }}
          />
        )}
        <span className="font-semibold">{tip.title}</span>
      </div>
      <div className="mt-0.5 tabular-nums text-gray-200">{tip.value}</div>
    </div>
  );
}

// ── path helpers (round only the data-end, square at baseline) ───────────────
function hBarPath(x: number, y: number, w: number, h: number, r0: number) {
  const r = Math.max(0, Math.min(r0, w, h / 2));
  if (w <= 0) return "";
  return `M${x},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${
    y + h - r
  } A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x} Z`;
}
function vBarPath(x: number, y: number, w: number, h: number, r0: number) {
  const r = Math.max(0, Math.min(r0, w / 2, h));
  if (h <= 0) return "";
  // grows up from baseline at y+h; round top corners
  return `M${x},${y + h} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} H${
    x + w - r
  } A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h} Z`;
}

// ════════════════════════════════════════════════════════════════════════════
// Legend
// ════════════════════════════════════════════════════════════════════════════
export function Legend({
  items,
}: {
  items: { label: string; value?: number | string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[3px]"
            style={{ background: it.color }}
          />
          <span className="text-xs text-gray-600">{it.label}</span>
          {it.value !== undefined && (
            <span className="text-xs font-semibold text-gray-900 tabular-nums">
              {typeof it.value === "number" ? nf(it.value) : it.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Donut — composition / status breakdown
// ════════════════════════════════════════════════════════════════════════════
export function Donut({
  data,
  centerLabel,
  centerValue,
  size = 176,
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
}) {
  const [tip, setTip] = useState<Tip | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const gap = total > 0 && data.filter((d) => d.value > 0).length > 1 ? 2 : 0;

  let offset = 0;
  const segs = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const frac = total > 0 ? d.value / total : 0;
      const len = frac * C;
      const seg = {
        ...d,
        frac,
        dash: Math.max(len - gap, 0.001),
        offset,
      };
      offset += len;
      return seg;
    });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={GRID} strokeWidth={stroke} />
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {segs.map((s) => (
              <circle
                key={s.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                onMouseMove={(e) => {
                  const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({
                    x: e.clientX - box.left,
                    y: e.clientY - box.top,
                    title: s.label,
                    value: `${nf(s.value)} · ${Math.round(s.frac * 100)}%`,
                    color: s.color,
                  });
                }}
                onMouseLeave={() => setTip(null)}
                style={{ transition: "stroke-dashoffset .6s ease" }}
              />
            ))}
          </g>
          {(centerValue !== undefined || centerLabel) && (
            <g transform={`rotate(0)`}>
              <text
                x={cx}
                y={cy - 2}
                textAnchor="middle"
                fontSize={26}
                fontWeight={700}
                fill={INK}
              >
                {centerValue !== undefined ? centerValue : nf(total)}
              </text>
              {centerLabel && (
                <text
                  x={cx}
                  y={cy + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill={MUTED}
                >
                  {centerLabel}
                </text>
              )}
            </g>
          )}
        </svg>
        <Tooltip tip={tip} />
      </div>
      <div className="w-full min-w-0 flex-1 space-y-2">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.label} className="flex items-center gap-2.5">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ background: d.color }}
              />
              <span className="flex-1 truncate text-xs text-gray-600">{d.label}</span>
              <span className="text-xs font-semibold text-gray-900 tabular-nums">
                {nf(d.value)}
              </span>
              <span className="w-8 text-right text-[11px] text-gray-400 tabular-nums">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Horizontal ranked bars
// ════════════════════════════════════════════════════════════════════════════
export function HBars({
  data,
  color = SERIES[0],
  unit = "",
  emptyLabel = "No data",
}: {
  data: { label: string; value: number; color?: string }[];
  color?: string;
  unit?: string;
  emptyLabel?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const rows = data.length;
  const rowH = 34;
  const barH = 16;
  const labelW = Math.min(140, Math.max(88, Math.round((w || 320) * 0.32)));
  const valueW = 52;
  const height = Math.max(rowH * rows, rowH);
  const max = Math.max(1, ...data.map((d) => d.value));
  const x0 = labelW;
  const barMax = Math.max(10, (w || 320) - x0 - valueW);

  if (rows === 0) {
    return (
      <div ref={ref} className="flex h-24 w-full min-w-0 items-center justify-center text-sm text-gray-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <svg width={w || "100%"} height={height} className="block max-w-full">
        {data.map((d, i) => {
          const y = i * rowH + (rowH - barH) / 2;
          const bw = (d.value / max) * barMax;
          const c = d.color || color;
          return (
            <g key={d.label + i}>
              <text
                x={0}
                y={y + barH / 2}
                dominantBaseline="middle"
                fontSize={12}
                fill={INK2}
              >
                {d.label.length > 18 ? d.label.slice(0, 17) + "…" : d.label}
              </text>
              <rect x={x0} y={y} width={barMax} height={barH} rx={4} fill={GRID} opacity={0.5} />
              <path
                d={hBarPath(x0, y, Math.max(bw, d.value > 0 ? 3 : 0), barH, 4)}
                fill={c}
                onMouseMove={(e) => {
                  const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({
                    x: e.clientX - box.left,
                    y: e.clientY - box.top,
                    title: d.label,
                    value: `${nf(d.value)}${unit ? " " + unit : ""}`,
                    color: c,
                  });
                }}
                onMouseLeave={() => setTip(null)}
              />
              <text
                x={x0 + Math.max(bw, 3) + 6}
                y={y + barH / 2}
                dominantBaseline="middle"
                fontSize={12}
                fontWeight={600}
                fill={INK}
                className="tabular-nums"
              >
                {nf(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Vertical columns (single series)
// ════════════════════════════════════════════════════════════════════════════
export function Columns({
  data,
  color = SERIES[0],
  height = 220,
  unit = "",
}: {
  data: { label: string; value: number; color?: string }[];
  color?: string;
  height?: number;
  unit?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const padT = 16;
  const padB = 28;
  const padL = 34;
  const plotH = height - padT - padB;
  const width = w || 480;
  const plotW = width - padL - 8;
  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeil(max);
  const n = data.length;
  const slot = n > 0 ? plotW / n : plotW;
  const barW = Math.min(24, slot * 0.6);
  const ticks = 4;

  return (
    // min-w-0 is load-bearing: as a grid/flex child this container defaults to
    // min-width:auto, so the SVG's pixel width would become the column's minimum
    // and the layout could never shrink below it. The SVG is also only rendered
    // once the container has been measured, so it never forces its own width.
    <div ref={ref} className="relative w-full min-w-0">
      {w === 0 ? (
        <div style={{ height }} />
      ) : (
      <svg width={width} height={height} className="block max-w-full">
        {/* gridlines + y ticks */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const val = (niceMax / ticks) * i;
          const y = padT + plotH - (val / niceMax) * plotH;
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={width - 8} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={MUTED} className="tabular-nums">
                {compact(val)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const bh = (d.value / niceMax) * plotH;
          const x = padL + i * slot + (slot - barW) / 2;
          const y = padT + plotH - bh;
          const c = d.color || color;
          return (
            <g key={d.label + i}>
              <path
                d={vBarPath(x, y, barW, bh, 4)}
                fill={c}
                onMouseMove={(e) => {
                  const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({
                    x: e.clientX - box.left,
                    y: e.clientY - box.top,
                    title: d.label,
                    value: `${nf(d.value)}${unit ? " " + unit : ""}`,
                    color: c,
                  });
                }}
                onMouseLeave={() => setTip(null)}
              />
              <text
                x={x + barW / 2}
                y={padT + plotH + 14}
                textAnchor="middle"
                fontSize={10}
                fill={MUTED}
              >
                {d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label}
              </text>
            </g>
          );
        })}
        <line x1={padL} y1={padT + plotH} x2={width - 8} y2={padT + plotH} stroke={BASELINE} strokeWidth={1} />
      </svg>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Line / area — time series with crosshair
// ════════════════════════════════════════════════════════════════════════════
export function LineArea({
  data,
  color = SERIES[0],
  height = 220,
  unit = "",
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  unit?: string;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const padT = 16;
  const padB = 26;
  const padL = 34;
  const width = w || 480;
  const plotH = height - padT - padB;
  const plotW = width - padL - 10;
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = niceCeil(max);
  const ticks = 4;

  const xAt = (i: number) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - (v / niceMax) * plotH;

  const linePts = data.map((d, i) => `${xAt(i)},${yAt(d.value)}`);
  const linePath = linePts.length ? "M" + linePts.join(" L") : "";
  const areaPath = linePts.length
    ? `M${padL},${padT + plotH} L` +
      linePts.join(" L") +
      ` L${xAt(n - 1)},${padT + plotH} Z`
    : "";

  // label every ~Nth x to avoid collisions
  const step = Math.max(1, Math.ceil(n / 7));

  return (
    // See Columns: min-w-0 lets the container shrink inside the grid, and the
    // SVG only renders once measured so it never dictates the column width.
    <div ref={ref} className="relative w-full min-w-0">
      {w === 0 ? (
        <div style={{ height }} />
      ) : (
      <svg
        width={width}
        height={height}
        className="block max-w-full"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const mx = e.clientX - box.left;
          if (n === 0) return;
          const i = Math.round(((mx - padL) / plotW) * (n - 1));
          setHover(Math.max(0, Math.min(n - 1, i)));
        }}
      >
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const val = (niceMax / ticks) * i;
          const y = yAt(val);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={width - 10} y2={y} stroke={GRID} strokeWidth={1} />
              <text x={padL - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={MUTED} className="tabular-nums">
                {compact(val)}
              </text>
            </g>
          );
        })}
        {areaPath && <path d={areaPath} fill={color} opacity={0.1} />}
        {linePath && (
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {/* x labels */}
        {data.map((d, i) =>
          i % step === 0 || i === n - 1 ? (
            <text key={i} x={xAt(i)} y={padT + plotH + 14} textAnchor="middle" fontSize={10} fill={MUTED}>
              {d.label}
            </text>
          ) : null,
        )}
        {/* crosshair + marker */}
        {hover !== null && data[hover] && (
          <g>
            <line x1={xAt(hover)} y1={padT} x2={xAt(hover)} y2={padT + plotH} stroke={BASELINE} strokeWidth={1} />
            <circle cx={xAt(hover)} cy={yAt(data[hover].value)} r={5} fill={color} stroke={SURFACE} strokeWidth={2} />
          </g>
        )}
        {/* end dot when not hovering */}
        {hover === null && n > 0 && (
          <circle cx={xAt(n - 1)} cy={yAt(data[n - 1].value)} r={4} fill={color} stroke={SURFACE} strokeWidth={2} />
        )}
        <line x1={padL} y1={padT + plotH} x2={width - 10} y2={padT + plotH} stroke={BASELINE} strokeWidth={1} />
      </svg>
      )}
      {hover !== null && data[hover] && (
        <Tooltip
          tip={{
            x: xAt(hover),
            y: yAt(data[hover].value),
            title: data[hover].label,
            value: `${nf(data[hover].value)}${unit ? " " + unit : ""}`,
            color,
          }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Sparkline (for trend tiles)
// ════════════════════════════════════════════════════════════════════════════
export function Sparkline({
  data,
  color = SERIES[0],
  width = 96,
  height = 32,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const n = data.length;
  if (n === 0) return null;
  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const span = max - min || 1;
  const xAt = (i: number) => (n <= 1 ? width / 2 : (i / (n - 1)) * width);
  const yAt = (v: number) => height - ((v - min) / span) * height;
  const pts = data.map((v, i) => `${xAt(i)},${yAt(v)}`);
  const line = "M" + pts.join(" L");
  const area = `M${xAt(0)},${height} L` + pts.join(" L") + ` L${xAt(n - 1)},${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={area} fill={color} opacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xAt(n - 1)} cy={yAt(data[n - 1])} r={2.6} fill={color} stroke={SURFACE} strokeWidth={1.5} />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Grouped horizontal accuracy bars (value + track, used for quiz categories)
// ════════════════════════════════════════════════════════════════════════════
export function MeterRows({
  data,
}: {
  data: { label: string; value: number; sub?: string }[];
}) {
  if (data.length === 0)
    return <div className="py-6 text-center text-sm text-gray-400">No data yet</div>;
  return (
    <div className="space-y-3">
      {data.map((d) => {
        const tone =
          d.value >= 70 ? STATUS.good : d.value >= 50 ? STATUS.warning : STATUS.critical;
        return (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-gray-700">{d.label}</span>
              <span className="shrink-0 text-xs text-gray-500">
                {d.sub && <span className="mr-2 text-gray-400">{d.sub}</span>}
                <span className="font-semibold text-gray-900 tabular-nums">{d.value}%</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, d.value)}%`, background: tone }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── util: round a max up to a clean tick value ───────────────────────────────
function niceCeil(v: number): number {
  if (v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}
