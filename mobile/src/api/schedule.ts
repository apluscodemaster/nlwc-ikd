import type { RecurringService, SpecialService } from "~/shared";
import { api } from "./client";

export interface ScheduleResponse {
  recurring: RecurringService[];
  special: SpecialService[];
}

export const scheduleApi = {
  get: () => api.get<ScheduleResponse>("/api/schedule"),
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dayName(dayOfWeek: number): string {
  return DAYS[dayOfWeek] ?? "";
}

/** 18.5 → "6:30 PM" (hours are Lagos wall-clock, as entered by the admin). */
export function formatHour(hour: number): string {
  const h24 = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60);
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
