import { getAdminDb } from "@/lib/firebase-admin";

// ── Types ──

export interface RecurringService {
  id?: string;
  /** 0 = Sun … 6 = Sat */
  dayOfWeek: number;
  /** 24-h start hour (supports decimals, e.g. 18.5 = 6:30 PM) */
  startHour: number;
  /** 24-h end hour (exclusive) */
  endHour: number;
  /** Whether the event ends on the next day (overnight event) */
  endsNextDay?: boolean;
  /** Display label, e.g. "Sunday Worship Service" */
  label: string;
  /** Optional description shown on cards / detail views */
  description?: string;
  /** Cloudinary public ID or full URL for a banner/poster image */
  imageUrl?: string;
  /** Event venue, e.g. "Church Auditorium, Ikorodu" */
  location?: string;
  /** Display category: Worship, Prayer, Study, Special, Conference, Youth */
  category?: string;
  /** Emoji icon for the event card, e.g. "⛪" */
  icon?: string;
  /** Human-readable recurrence text, e.g. "Every Sunday" */
  recurrenceLabel?: string;
  /** Whether this service is currently active in the schedule */
  active: boolean;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp */
  updatedAt: string;
}

export interface SpecialService {
  id?: string;
  /** Full date: YYYY-MM-DD */
  date: string;
  /** 24-h start hour */
  startHour: number;
  /** 24-h end hour */
  endHour: number;
  /** Whether the event ends on the next day (overnight event) */
  endsNextDay?: boolean;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Cloudinary public ID or full URL for a banner/poster image */
  imageUrl?: string;
  /** Event venue */
  location?: string;
  /** Display category: Worship, Prayer, Study, Special, Conference, Youth */
  category?: string;
  /** Emoji icon for the event card */
  icon?: string;
  /** Human-readable recurrence text, e.g. "One-time event" */
  recurrenceLabel?: string;
  /** Whether this service is active */
  active: boolean;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp */
  updatedAt: string;
}

/**
 * A meeting held once a year over a season (e.g. Family Life Festival, the
 * Sundays in September). Shown on the home page; not part of the live
 * schedule, which comes from the weekly and special entries.
 */
export interface AnnualMeeting {
  id?: string;
  name: string;
  /** When in the year it holds, e.g. "Sundays in September". */
  period: string;
  description?: string;
  /** Full image URL (the home page shows only http(s) URLs). */
  imageUrl?: string;
  active: boolean;
  /** Display order, lowest first. */
  order: number;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp */
  updatedAt: string;
}

/** Schedule-wide settings, stored as one Firestore document. */
export interface ScheduleSettings {
  /**
   * Whether the monthly job (/api/cron/special-services) adds next month's
   * Sithrah and Season of the Spirit entries. Toggled from the admin Schedule
   * page; on by default.
   */
  autoAddSpecials: boolean;
  /**
   * Set once the default services have been seeded (or the schedule was found
   * already populated). After that the defaults are never seeded again, so an
   * admin who removes every entry gets an empty schedule, not the defaults.
   */
  seeded: boolean;
  /** Set once the default annual meetings have been seeded (as `seeded`). */
  annualSeeded?: boolean;
}

const RECURRING_COLLECTION = "schedule_recurring";
const SPECIAL_COLLECTION = "schedule_special";
const ANNUAL_COLLECTION = "schedule_annual";
const SETTINGS_DOC = { collection: "schedule_meta", id: "settings" };

const DEFAULT_SETTINGS: ScheduleSettings = {
  autoAddSpecials: true,
  seeded: false,
};

// ── Settings ──

export async function getScheduleSettings(): Promise<ScheduleSettings> {
  const db = getAdminDb();
  const snap = await db
    .collection(SETTINGS_DOC.collection)
    .doc(SETTINGS_DOC.id)
    .get();
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<ScheduleSettings>) };
}

export async function updateScheduleSettings(
  data: Partial<ScheduleSettings>,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(SETTINGS_DOC.collection)
    .doc(SETTINGS_DOC.id)
    .set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

// ── Recurring Services ──

export async function getRecurringServices(): Promise<RecurringService[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(RECURRING_COLLECTION)
    .orderBy("dayOfWeek", "asc")
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<RecurringService, "id">),
  }));
}

export async function createRecurringService(
  data: Omit<RecurringService, "id" | "createdAt" | "updatedAt">,
): Promise<RecurringService> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const docData = { ...data, createdAt: now, updatedAt: now };
  const ref = await db.collection(RECURRING_COLLECTION).add(docData);
  return { id: ref.id, ...docData };
}

export async function updateRecurringService(
  id: string,
  data: Partial<Omit<RecurringService, "id" | "createdAt">>,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(RECURRING_COLLECTION)
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deleteRecurringService(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(RECURRING_COLLECTION).doc(id).delete();
}

// ── Special (One-Off) Services ──

export async function getSpecialServices(): Promise<SpecialService[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(SPECIAL_COLLECTION)
    .orderBy("date", "asc")
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SpecialService, "id">),
  }));
}

export async function createSpecialService(
  data: Omit<SpecialService, "id" | "createdAt" | "updatedAt">,
): Promise<SpecialService> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const docData = { ...data, createdAt: now, updatedAt: now };
  const ref = await db.collection(SPECIAL_COLLECTION).add(docData);
  return { id: ref.id, ...docData };
}

export async function updateSpecialService(
  id: string,
  data: Partial<Omit<SpecialService, "id" | "createdAt">>,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(SPECIAL_COLLECTION)
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deleteSpecialService(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(SPECIAL_COLLECTION).doc(id).delete();
}

// ── Annual Meetings ──

export async function getAnnualMeetings(): Promise<AnnualMeeting[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(ANNUAL_COLLECTION)
    .orderBy("order", "asc")
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<AnnualMeeting, "id">),
  }));
}

export async function createAnnualMeeting(
  data: Omit<AnnualMeeting, "id" | "createdAt" | "updatedAt">,
): Promise<AnnualMeeting> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const docData = { ...data, createdAt: now, updatedAt: now };
  const ref = await db.collection(ANNUAL_COLLECTION).add(docData);
  return { id: ref.id, ...docData };
}

export async function updateAnnualMeeting(
  id: string,
  data: Partial<Omit<AnnualMeeting, "id" | "createdAt">>,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(ANNUAL_COLLECTION)
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deleteAnnualMeeting(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(ANNUAL_COLLECTION).doc(id).delete();
}
