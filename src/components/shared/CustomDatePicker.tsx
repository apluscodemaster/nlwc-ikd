"use client";

import React, { useEffect, useRef, useState } from "react";
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
  /** Overrides the trigger button classes when provided. */
  className?: string;
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
  className,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parseISO(value);
  const [viewDate, setViewDate] = useState<Date>(selected ?? new Date());

  // Keep the visible month in sync when the value changes from outside.
  useEffect(() => {
    const s = parseISO(value);
    if (s) setViewDate(new Date(s.getFullYear(), s.getMonth(), 1));
  }, [value]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={
          className ??
          "w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-left focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all cursor-pointer"
        }
      >
        <span className={triggerLabel ? "text-gray-900" : "text-gray-400"}>
          {triggerLabel || placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl p-3">
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
        </div>
      )}
    </div>
  );
}
