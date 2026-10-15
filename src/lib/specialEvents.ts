/**
 * The church's rule-based special services, defined once.
 *
 * - Sithrah: every 2nd Saturday, 12:00–18:00, with preparatory prayer on the
 *   Thursday and Friday evenings before it.
 * - Season of the Spirit: every Sunday in February plus the 1st Sunday of
 *   March, 08:00–15:00.
 *
 * Used by the one-time seeding in /api/schedule and by the monthly cron job
 * that adds the next month's entries (/api/cron/special-services). Dates are
 * pure calendar dates (YYYY-MM-DD) computed in UTC, so no time zone can shift
 * them; hours are Lagos wall-clock time, like every schedule entry.
 */

export interface SpecialEventInput {
  date: string;
  startHour: number;
  endHour: number;
  label: string;
  description: string;
  imageUrl: string;
  location: string;
  category: string;
  icon: string;
  recurrenceLabel: string;
  active: boolean;
}

type Template = Omit<SpecialEventInput, "date" | "recurrenceLabel">;

export const SITHRAH: Template = {
  startHour: 12,
  endHour: 18,
  label: "Sithrah",
  description:
    "A special monthly time of prayer and spiritual refreshing before the Lord.",
  imageUrl: "",
  location: "Church Auditorium, Ikorodu",
  category: "Special",
  icon: "🕊️",
  active: true,
};

export const SITHRAH_PREP_THURSDAY: Template = {
  startHour: 18,
  endHour: 21,
  label: "Sithrah Preparatory Prayer",
  description:
    "Prayer meeting in preparation for the upcoming Sithrah Saturday.",
  imageUrl: "",
  location: "Online",
  category: "Prayer",
  icon: "🔥",
  active: true,
};

export const SITHRAH_PREP_FRIDAY: Template = {
  ...SITHRAH_PREP_THURSDAY,
  description:
    "Continuing prayer meeting in preparation for the upcoming Sithrah Saturday.",
};

export const SEASON_OF_THE_SPIRIT: Template = {
  startHour: 8,
  endHour: 15,
  label: "Season of the Spirit",
  description:
    "Annual conference — a special season of the outpouring of the Holy Spirit.",
  imageUrl: "",
  location: "Church Auditorium, Ikorodu",
  category: "Conference",
  icon: "✨",
  active: true,
};

/** YYYY-MM-DD for a calendar date; day overflow rolls into the next month. */
export function ymd(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

/** Day of month of the 2nd Saturday (month is 0-indexed). Always 8–14. */
export function secondSaturday(year: number, month: number): number {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return 1 + ((6 - firstDow + 7) % 7) + 7;
}

/** Days of month that are Sundays (month is 0-indexed). */
function sundaysOf(year: number, month: number): number[] {
  const days: number[] = [];
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  for (let d = 1 + ((7 - firstDow) % 7); d <= daysInMonth; d += 7) {
    days.push(d);
  }
  return days;
}

/**
 * Every rule-based special service falling in the given calendar month
 * (0-indexed), in date order.
 */
export function specialEventsForMonth(
  year: number,
  month: number,
): SpecialEventInput[] {
  const events: SpecialEventInput[] = [];

  // Sithrah prep (Thu/Fri) and Sithrah itself. The 2nd Saturday is on or
  // after the 8th, so its Thursday and Friday are always in the same month.
  const sat = secondSaturday(year, month);
  events.push(
    {
      ...SITHRAH_PREP_THURSDAY,
      date: ymd(year, month, sat - 2),
      recurrenceLabel: "Thursday before Sithrah",
    },
    {
      ...SITHRAH_PREP_FRIDAY,
      date: ymd(year, month, sat - 1),
      recurrenceLabel: "Friday before Sithrah",
    },
    {
      ...SITHRAH,
      date: ymd(year, month, sat),
      recurrenceLabel: "Every 2nd Saturday",
    },
  );

  // Season of the Spirit: all February Sundays + the 1st Sunday of March.
  if (month === 1) {
    for (const d of sundaysOf(year, 1)) {
      events.push({
        ...SEASON_OF_THE_SPIRIT,
        date: ymd(year, 1, d),
        recurrenceLabel: "Every Sunday in February",
      });
    }
  } else if (month === 2) {
    events.push({
      ...SEASON_OF_THE_SPIRIT,
      date: ymd(year, 2, sundaysOf(year, 2)[0]),
      recurrenceLabel: "1st Sunday of March",
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
