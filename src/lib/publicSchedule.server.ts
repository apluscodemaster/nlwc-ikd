import { revalidateTag, unstable_cache } from "next/cache";
import {
  getRecurringServices,
  createRecurringService,
  getSpecialServices,
  createSpecialService,
  getScheduleSettings,
  updateScheduleSettings,
  getAnnualMeetings,
  createAnnualMeeting,
} from "@/lib/scheduleService";
import {
  SITHRAH,
  SITHRAH_PREP_THURSDAY,
  SITHRAH_PREP_FRIDAY,
  SEASON_OF_THE_SPIRIT,
} from "@/lib/specialEvents";

/**
 * The public schedule (services, special services, annual meetings), as GET
 * /api/schedule returns it and the home page renders it.
 *
 * Cached for everyone (5 minutes, tag "schedule") instead of reading four
 * Firestore collections on every visit; the admin write handlers and the
 * special-services cron call expireSchedule(), so a change shows at once.
 */
const SCHEDULE_TAG = "schedule";

// ── Default recurring services (seeded when Firestore is empty) ──
const DEFAULT_RECURRING = [
  {
    dayOfWeek: 0,
    startHour: 8,
    endHour: 15,
    label: "Sunday Worship Service",
    description:
      "Join us for an uplifting morning of worship and life-transforming teaching.",
    imageUrl: "",
    location: "Church Auditorium, Ikorodu",
    category: "Worship",
    icon: "⛪",
    recurrenceLabel: "Every Sunday",
    active: true,
  },
  {
    dayOfWeek: 3,
    startHour: 18,
    endHour: 21,
    label: "Prayer Meeting",
    description:
      "A powerful time of corporate intercession and supplication before the throne of grace.",
    imageUrl: "",
    location: "Church Auditorium, Ikorodu",
    category: "Prayer",
    icon: "🙏",
    recurrenceLabel: "Every Wednesday",
    active: true,
  },
  {
    dayOfWeek: 5,
    startHour: 18,
    endHour: 22,
    label: "Bible Study",
    description:
      "A deep dive into God's word to build your faith and strengthen your walk with Christ.",
    imageUrl: "",
    location: "Church Auditorium, Ikorodu",
    category: "Study",
    icon: "📖",
    recurrenceLabel: "Every Friday",
    active: true,
  },
];

// ── Default annual meetings (seeded once, like the services above) ──
const DEFAULT_ANNUAL = [
  {
    name: "Season of the Spirit",
    period: "February – March",
    description:
      "A special season of spiritual refreshing and prophetic advancement.",
    imageUrl:
      "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247798/nlwc-ikd-assets/nu4dqvqovsnbodckjmnu.avif",
    active: true,
    order: 1,
  },
  {
    name: "Family Life Festival",
    period: "Sundays in September",
    description:
      "A month of Sundays devoted to building strong marriages and families.",
    imageUrl:
      "https://res.cloudinary.com/dj7rh8h6r/image/upload/f_auto,q_auto:eco,w_800/v1775202695/community-2_vwupj4.jpg",
    active: true,
    order: 2,
  },
];

// ── Compute default special events based on current date ──
function getDefaultSpecialEvents() {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function getSecondSaturday(year: number, month: number): Date {
    const firstDay = new Date(year, month, 1);
    const daysUntilSat = (6 - firstDay.getDay() + 7) % 7;
    const firstSat = new Date(year, month, 1 + daysUntilSat);
    const secondSat = new Date(firstSat);
    secondSat.setDate(firstSat.getDate() + 7);
    secondSat.setHours(12, 0, 0, 0);
    return secondSat;
  }

  const events: Array<{
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
  }> = [];

  // Sithrah — 2nd Saturday of current or next month
  let sithrahDate = getSecondSaturday(now.getFullYear(), now.getMonth());
  if (sithrahDate <= now) {
    const nm = now.getMonth() + 1;
    const yr = nm > 11 ? now.getFullYear() + 1 : now.getFullYear();
    sithrahDate = getSecondSaturday(yr, nm % 12);
  }

  events.push({
    ...SITHRAH,
    date: fmt(sithrahDate),
    recurrenceLabel: "Every 2nd Saturday",
  });

  // Sithrah Preparatory Prayer — Thursday before Sithrah
  const sithrahThu = new Date(sithrahDate);
  sithrahThu.setDate(sithrahDate.getDate() - 2);
  sithrahThu.setHours(18, 0, 0, 0);
  if (sithrahThu > now) {
    events.push({
      ...SITHRAH_PREP_THURSDAY,
      date: fmt(sithrahThu),
      recurrenceLabel: "Thursday before Sithrah",
    });
  }

  // Sithrah Preparatory Prayer — Friday before Sithrah
  const sithrahFri = new Date(sithrahDate);
  sithrahFri.setDate(sithrahDate.getDate() - 1);
  sithrahFri.setHours(18, 0, 0, 0);
  if (sithrahFri > now) {
    events.push({
      ...SITHRAH_PREP_FRIDAY,
      date: fmt(sithrahFri),
      recurrenceLabel: "Friday before Sithrah",
    });
  }

  // Season of the Spirit — Feb Sundays + 1st Sunday of March (if upcoming)
  const year = now.getFullYear();
  const febSundays: Date[] = [];
  const d = new Date(year, 1, 1);
  while (d.getMonth() === 1) {
    if (d.getDay() === 0) febSundays.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  const marchFirst = new Date(year, 2, 1);
  while (marchFirst.getDay() !== 0)
    marchFirst.setDate(marchFirst.getDate() + 1);
  const sosDates = [...febSundays, marchFirst];
  const futureSos = sosDates.filter((s) => s > now);

  for (const sosDate of futureSos) {
    sosDate.setHours(8, 0, 0, 0);
    events.push({
      ...SEASON_OF_THE_SPIRIT,
      date: fmt(sosDate),
      recurrenceLabel: `${futureSos.length} Sunday${futureSos.length > 1 ? "s" : ""} remaining`,
    });
  }

  return events;
}

async function loadPublicSchedule() {
  const [fetchedRecurring, fetchedSpecial, fetchedAnnual, settings] =
    await Promise.all([
      getRecurringServices(),
      getSpecialServices(),
      getAnnualMeetings(),
      getScheduleSettings(),
    ]);

  // The admin Schedule page is the source of truth. The defaults below are
  // only a starting point for a brand-new site: they are seeded ONCE, the
  // first time the schedule is ever read. They used to be re-seeded whenever
  // a list was empty, so deleting every event brought the defaults back.
  let recurring = fetchedRecurring;
  let special = fetchedSpecial;
  if (!settings.seeded) {
    if (recurring.length === 0 && special.length === 0) {
      recurring = await Promise.all(
        DEFAULT_RECURRING.map((svc) => createRecurringService(svc)),
      );
      special = await Promise.all(
        getDefaultSpecialEvents().map((evt) => createSpecialService(evt)),
      );
    }
    // Also marks an already-populated schedule, so it is never seeded.
    await updateScheduleSettings({ seeded: true });
  }

  // Annual meetings were hard-coded on the home page; seed them once so
  // the admin can edit them, and never again (deleting all stays empty).
  let annual = fetchedAnnual;
  if (!settings.annualSeeded) {
    if (annual.length === 0) {
      annual = await Promise.all(
        DEFAULT_ANNUAL.map((m) => createAnnualMeeting(m)),
      );
    }
    await updateScheduleSettings({ annualSeeded: true });
  }

  // Plain JSON, the same shape the route has always returned.
  return JSON.parse(
    JSON.stringify({
      recurring,
      special,
      annual,
      settings: { autoAddSpecials: settings.autoAddSpecials },
    }),
  ) as {
    recurring: Awaited<ReturnType<typeof getRecurringServices>>;
    special: Awaited<ReturnType<typeof getSpecialServices>>;
    annual: Awaited<ReturnType<typeof getAnnualMeetings>>;
    settings: { autoAddSpecials: boolean };
  };
}

export const getPublicSchedule = unstable_cache(
  loadPublicSchedule,
  ["public-schedule"],
  { tags: [SCHEDULE_TAG], revalidate: 300 },
);

/** Call after any schedule write: the next read gets fresh data. */
export function expireSchedule() {
  revalidateTag(SCHEDULE_TAG, { expire: 0 });
}
