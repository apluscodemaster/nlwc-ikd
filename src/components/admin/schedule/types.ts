import type { RecurringService, SpecialService } from "@/lib/scheduleService";

export type ActiveTab = "recurring" | "special";
export type ModalMode = "create" | "edit" | null;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const CATEGORIES = [
  "Worship",
  "Prayer",
  "Study",
  "Special",
  "Conference",
  "Youth",
];

export function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

export type { RecurringService, SpecialService };
