"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CustomDatePickerProps {
  /** Selected value as an ISO date string (YYYY-MM-DD), matching the native
   *  <input type="date"> contract this component replaces. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  /** Overrides the trigger button classes (e.g. to blend into a filter pill). */
  className?: string;
  /** Applied to the outer wrapper (e.g. "w-full" so the trigger fills a pill). */
  wrapperClassName?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PANEL_WIDTH = 288; // w-72
const PANEL_HEIGHT = 340; // approximate, for flip calculation
const GAP = 8;

const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time ISO (YYYY-MM-DD) — avoids the UTC shift `toISOString()` causes. */
function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parse a YYYY-MM-DD string into a local Date (no timezone drift). */
function parseISO(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  id,
  disabled = false,
  className,
  wrapperClassName,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = parseISO(value);
  const [viewDate, setViewDate] = useState<Date>(selected ?? new Date());

  useEffect(() => setMounted(true), []);

  // Keep the visible month in sync when the value changes from outside.
  useEffect(() => {
    const s = parseISO(value);
    if (s) setViewDate(new Date(s.getFullYear(), s.getMonth(), 1));
  }, [value]);

  // Position the portal panel relative to the trigger, flipping/clamping to
  // stay within the viewport. Recomputed on open, scroll and resize so it works
  // inside modals and scrollable lists.
  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    let left = rect.left;
    if (left + PANEL_WIDTH > window.innerWidth - GAP) {
      left = Math.max(GAP, window.innerWidth - PANEL_WIDTH - GAP);
    }

    let top = rect.bottom + GAP;
    const fitsBelow = top + PANEL_HEIGHT <= window.innerHeight - GAP;
    const fitsAbove = rect.top - GAP - PANEL_HEIGHT >= GAP;
    if (!fitsBelow && fitsAbove) {
      top = rect.top - GAP - PANEL_HEIGHT;
    }

    setCoords({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    computePosition();
    const handle = () => computePosition();
    // Capture phase catches scrolls on any ancestor container.
    window.addEventListener("scroll", handle, true);
    window.addEventListener("resize", handle);
    return () => {
      window.removeEventListener("scroll", handle, true);
      window.removeEventListener("resize", handle);
    };
  }, [open, computePosition]);

  // Close on outside click / Escape (checks both trigger and portalled panel).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISO(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const triggerLabel = selected
    ? selected.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const goMonth = (delta: number) =>
    setViewDate(new Date(year, month + delta, 1));

  return (
    <div className={wrapperClassName ?? "relative"}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={
          className ??
          "w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-left focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        }
      >
        <span className={triggerLabel ? "text-gray-900" : "text-gray-400"}>
          {triggerLabel || placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {mounted &&
        open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            className="z-100 w-72 rounded-xl border border-gray-200 bg-white shadow-xl p-3"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headings */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="h-7 flex items-center justify-center text-[11px] font-semibold text-gray-400"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={`pad-${i}`} className="h-8" />;
                const iso = `${year}-${pad(month + 1)}-${pad(d)}`;
                const isSelected = iso === value;
                const isToday = iso === todayISO;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`h-8 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white"
                        : isToday
                          ? "text-primary ring-1 ring-inset ring-primary/40 hover:bg-primary/5"
                          : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  onChange(toISO(today));
                  setOpen(false);
                }}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Today
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
