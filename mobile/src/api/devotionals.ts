/**
 * Devotionals. The latest one comes from the cached API route (as on the
 * website's homepage); the archive and detail read Firestore directly with
 * the same queries as the website's lib/devotionals.ts (public read in
 * firestore.rules).
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "~/lib/firebase";
import { api } from "./client";

const COLLECTION = "devotionals";

export interface DevotionalItem {
  id: string;
  title: string;
  /** ISO date of release */
  scheduledDate: string;
  pdfUrl?: string;
}

function toItem(id: string, data: Record<string, unknown>): DevotionalItem {
  const ts = data.scheduledDate as Timestamp | undefined;
  return {
    id,
    title: String(data.title ?? ""),
    scheduledDate: ts?.toDate ? ts.toDate().toISOString() : String(data.scheduledDate ?? ""),
    pdfUrl: typeof data.pdfUrl === "string" ? data.pdfUrl : undefined,
  };
}

export interface DevotionalPage {
  items: DevotionalItem[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const devotionalsApi = {
  latest: async () =>
    (await api.get<{ devotional: DevotionalItem | null }>("/api/devotionals/latest")).devotional,

  page: async (cursor: QueryDocumentSnapshot | null, pageSize = 15): Promise<DevotionalPage> => {
    const base = query(
      collection(getDb(), COLLECTION),
      where("scheduledDate", "<=", Timestamp.now()),
      orderBy("scheduledDate", "desc"),
    );
    const q = cursor ? query(base, startAfter(cursor), limit(pageSize)) : query(base, limit(pageSize));
    const snap = await getDocs(q);
    return {
      items: snap.docs.map((d) => toItem(d.id, d.data())),
      cursor: snap.docs[snap.docs.length - 1] ?? null,
      hasMore: snap.docs.length === pageSize,
    };
  },

  detail: async (id: string): Promise<DevotionalItem | null> => {
    const snap = await getDoc(doc(getDb(), COLLECTION, id));
    if (!snap.exists()) return null;
    const item = toItem(snap.id, snap.data());
    // Not released yet: treat as missing, as the website does.
    if (item.scheduledDate && new Date(item.scheduledDate).getTime() > Date.now()) return null;
    return item;
  },
};
