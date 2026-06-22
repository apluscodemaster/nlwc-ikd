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

const RECURRING_COLLECTION = "schedule_recurring";
const SPECIAL_COLLECTION = "schedule_special";

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
