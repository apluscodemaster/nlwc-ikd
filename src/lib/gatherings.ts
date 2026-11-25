import type { AdminAnnualMeeting } from "@/data/services";
import type { RecurringService } from "@/lib/scheduleService";

/** What the home page "Weekly Meetings" section shows. */
export interface Gatherings {
  weekly: RecurringService[];
  /** Undefined when the API predates admin-managed annual meetings. */
  annual?: AdminAnnualMeeting[];
}

/** React Query key shared by the server prefetch and ServiceTimes. */
export const GATHERINGS_QUERY_KEY = ["schedule", "gatherings"] as const;

/** Active weekly services by day and time, and active annual meetings in order. */
export function toGatherings(data: {
  recurring?: RecurringService[];
  annual?: AdminAnnualMeeting[];
}): Gatherings {
  return {
    weekly: (data.recurring ?? [])
      .filter((s) => s.active !== false)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour),
    annual: data.annual
      ?.filter((m) => m.active !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  };
}
