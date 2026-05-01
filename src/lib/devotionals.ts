import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { getAuthorizationHeader } from "./authClient";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Devotional {
  id: string;
  title: string;
  scheduledDate: Timestamp;
  pdfUrl: string;
  storagePath: string;
  createdAt: Timestamp;
}

export interface DevotionalInput {
  title: string;
  scheduledDate: Date;
  file: File;
}

const COLLECTION = "devotionals";

// ──────────────────────────────────────────────
// Public Queries
// ──────────────────────────────────────────────

/** Get the most recent devotional whose scheduledDate <= now */
export async function getLatestDevotional(): Promise<Devotional | null> {
  const q = query(
    collection(db, COLLECTION),
    where("scheduledDate", "<=", Timestamp.now()),
    orderBy("scheduledDate", "desc"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Devotional;
}

/** Get a single devotional by ID */
export async function getDevotionalById(
  id: string,
): Promise<Devotional | null> {
  const docRef = doc(db, COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Devotional;
}

/** Get chronologically adjacent devotionals (for prev/next navigation) */
export async function getAdjacentDevotionals(scheduledDate: Timestamp) {
  // Previous (earlier date)
  const prevQ = query(
    collection(db, COLLECTION),
    where("scheduledDate", "<", scheduledDate),
    where("scheduledDate", "<=", Timestamp.now()),
    orderBy("scheduledDate", "desc"),
    limit(1),
  );

  // Next (later date, but still <= now)
  const nextQ = query(
    collection(db, COLLECTION),
    where("scheduledDate", ">", scheduledDate),
    where("scheduledDate", "<=", Timestamp.now()),
    orderBy("scheduledDate", "asc"),
    limit(1),
  );

  const [prevSnap, nextSnap] = await Promise.all([
    getDocs(prevQ),
    getDocs(nextQ),
  ]);

  const prev = prevSnap.empty
    ? null
    : ({ id: prevSnap.docs[0].id, ...prevSnap.docs[0].data() } as Devotional);
  const next = nextSnap.empty
    ? null
    : ({ id: nextSnap.docs[0].id, ...nextSnap.docs[0].data() } as Devotional);

  return { prev, next };
}

/** Paginated list of published devotionals (scheduledDate <= now) */
export async function getPublishedDevotionals(
  pageSize: number = 12,
  lastDoc?: DocumentSnapshot,
  filter?: { month: number; year: number }, // month is 0-11
) {
  let baseQuery = query(
    collection(db, COLLECTION),
    where("scheduledDate", "<=", Timestamp.now()),
    orderBy("scheduledDate", "desc"),
  );

  if (filter) {
    const startDate = new Date(filter.year, filter.month, 1);
    const endDate = new Date(filter.year, filter.month + 1, 1);
    const startTs = Timestamp.fromDate(startDate);
    const endTs = Timestamp.fromDate(endDate);

    baseQuery = query(
      collection(db, COLLECTION),
      where("scheduledDate", ">=", startTs),
      where("scheduledDate", "<", endTs),
      // We still need this to ensure they are published,
      // though month filter usually implies past dates
      where("scheduledDate", "<=", Timestamp.now()),
      orderBy("scheduledDate", "desc"),
    );
  }

  let finalQuery = query(baseQuery, limit(pageSize));

  if (lastDoc) {
    finalQuery = query(baseQuery, startAfter(lastDoc), limit(pageSize));
  }

  const snap = await getDocs(finalQuery);
  const devotionals = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Devotional,
  );
  const lastVisible = snap.docs[snap.docs.length - 1] || null;
  return { devotionals, lastVisible, hasMore: snap.docs.length === pageSize };
}

// ──────────────────────────────────────────────
// Admin Queries
// ──────────────────────────────────────────────

/** Get ALL devotionals (including future-dated) for admin */
export async function getAllDevotionals(): Promise<Devotional[]> {
  const q = query(collection(db, COLLECTION), orderBy("scheduledDate", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Devotional);
}

// ──────────────────────────────────────────────
// Admin Mutations
// ──────────────────────────────────────────────

/** Upload PDF and create a Firestore document */
export async function createDevotional(
  input: DevotionalInput,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("title", input.title); // Send title for better filename control

  onProgress?.(20);

  const authHeader = await getAuthorizationHeader();

  const response = await fetch("/api/devotionals/upload", {
    method: "POST",
    headers: { Authorization: authHeader },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Upload failed");
  }

  const { url, publicId } = await response.json();
  onProgress?.(80);

  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      title: input.title,
      scheduledDate: Timestamp.fromDate(input.scheduledDate),
      pdfUrl: url,
      storagePath: publicId,
      createdAt: Timestamp.now(),
    });

    onProgress?.(100);
    return docRef.id;
  } catch (dbError) {
    console.error("Firestore addDoc failed:", dbError);
    throw dbError;
  }
}

/** Update title and/or scheduled date */
export async function updateDevotional(
  id: string,
  data: { title?: string; scheduledDate?: Date },
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.scheduledDate !== undefined)
    updateData.scheduledDate = Timestamp.fromDate(data.scheduledDate);

  await updateDoc(doc(db, COLLECTION, id), updateData);
}

/** Replace the PDF file in Storage (same path → overwrite) */
export async function replaceDevotionalPdf(
  id: string,
  newFile: File,
  onProgress?: (progress: number) => void,
) {
  const devotional = await getDevotionalById(id);
  if (!devotional) throw new Error("Devotional not found");

  const formData = new FormData();
  formData.append("file", newFile);
  formData.append("publicId", devotional.storagePath); // Use same public ID to overwrite

  onProgress?.(20);

  const authHeader = await getAuthorizationHeader();

  const response = await fetch("/api/devotionals/upload", {
    method: "POST",
    headers: { Authorization: authHeader },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Replacement failed");
  }

  const { url } = await response.json();
  onProgress?.(80);

  await updateDoc(doc(db, COLLECTION, id), { pdfUrl: url });
  onProgress?.(100);
}

/** Delete both the Firestore document and the Cloudinary file */
export async function deleteDevotional(id: string) {
  const devotional = await getDevotionalById(id);
  if (!devotional) throw new Error("Devotional not found");

  // Delete from Cloudinary
  try {
    const authHeader = await getAuthorizationHeader();
    const response = await fetch("/api/devotionals/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ publicId: devotional.storagePath }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn(
        "Cloudinary deletion failed, but continuing with Firestore:",
        error,
      );
    }
  } catch (err) {
    console.warn("Error calling Cloudinary delete API:", err);
  }

  // Delete Firestore document
  await deleteDoc(doc(db, COLLECTION, id));
}
