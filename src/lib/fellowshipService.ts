import { getAdminDb } from "@/lib/firebase-admin";
import { fellowshipCenters, type FellowshipCenter } from "@/data/centers";

// ── Types ──

/**
 * A house fellowship center as stored in Firestore. Extends the display shape
 * the public pages already consume (`FellowshipCenter`) with the admin-only
 * housekeeping fields, so the frontend can keep rendering documents from the
 * API exactly as it rendered the old static list.
 */
export interface FellowshipCenterRecord extends FellowshipCenter {
  /** Hidden from the public pages when false; kept for the admin. */
  active: boolean;
  /** Position on the public page (ascending). */
  order: number;
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp */
  updatedAt: string;
}

export type FellowshipCenterInput = Omit<
  FellowshipCenterRecord,
  "id" | "createdAt" | "updatedAt"
>;

export const FELLOWSHIP_COLLECTION = "fellowship_centers";

// ── Reads ──

export async function getFellowshipCenters(options: {
  includeInactive?: boolean;
} = {}): Promise<FellowshipCenterRecord[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(FELLOWSHIP_COLLECTION)
    .orderBy("order", "asc")
    .get();
  const all = snapshot.docs.map((doc) => ({
    ...(doc.data() as Omit<FellowshipCenterRecord, "id">),
    id: doc.id,
  }));
  return options.includeInactive ? all : all.filter((c) => c.active);
}

// ── Writes ──

export async function createFellowshipCenter(
  data: FellowshipCenterInput,
): Promise<FellowshipCenterRecord> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const docData = { ...data, createdAt: now, updatedAt: now };
  const ref = await db.collection(FELLOWSHIP_COLLECTION).add(docData);
  return { id: ref.id, ...docData };
}

export async function updateFellowshipCenter(
  id: string,
  data: Partial<Omit<FellowshipCenterRecord, "id" | "createdAt">>,
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(FELLOWSHIP_COLLECTION)
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deleteFellowshipCenter(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(FELLOWSHIP_COLLECTION).doc(id).delete();
}

// ── Seeding ──

/**
 * Migrate the former static list (data/centers.ts) into Firestore. Runs only
 * when the collection is empty, and keeps each center's original id as its
 * document id so the seed is idempotent and any link that embedded an id
 * keeps resolving. From then on the admin is the source of truth; the static
 * list is just the zero-latency fallback the public pages render first.
 */
export async function seedFellowshipCentersIfEmpty(): Promise<
  FellowshipCenterRecord[]
> {
  const db = getAdminDb();
  const col = db.collection(FELLOWSHIP_COLLECTION);
  const existing = await col.limit(1).get();
  if (!existing.empty) return [];

  const now = new Date().toISOString();
  const batch = db.batch();
  const seeded: FellowshipCenterRecord[] = fellowshipCenters.map(
    (center, index) => {
      const { id, ...rest } = center;
      const record: Omit<FellowshipCenterRecord, "id"> = {
        ...rest,
        active: true,
        order: index,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(col.doc(id), record);
      return { id, ...record };
    },
  );
  await batch.commit();
  return seeded;
}
