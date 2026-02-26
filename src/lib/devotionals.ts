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
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

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
) {
  let q = query(
    collection(db, COLLECTION),
    where("scheduledDate", "<=", Timestamp.now()),
    orderBy("scheduledDate", "desc"),
    limit(pageSize),
  );

  if (lastDoc) {
    q = query(
      collection(db, COLLECTION),
      where("scheduledDate", "<=", Timestamp.now()),
      orderBy("scheduledDate", "desc"),
      startAfter(lastDoc),
      limit(pageSize),
    );
  }

  const snap = await getDocs(q);
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
  // Sanitise filename: keep it deterministic for easy replacement later
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `devotionals/${safeName}`;
  const storageRef = ref(storage, storagePath);

  // Upload with progress tracking
  const uploadTask = uploadBytesResumable(storageRef, input.file, {
    contentType: "application/pdf",
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      reject,
      resolve,
    );
  });

  const pdfUrl = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(db, COLLECTION), {
    title: input.title,
    scheduledDate: Timestamp.fromDate(input.scheduledDate),
    pdfUrl,
    storagePath,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
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

  // Upload to the SAME path so Firebase overwrites the old version
  const storageRef = ref(storage, devotional.storagePath);
  const uploadTask = uploadBytesResumable(storageRef, newFile, {
    contentType: "application/pdf",
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      reject,
      resolve,
    );
  });

  const pdfUrl = await getDownloadURL(storageRef);
  await updateDoc(doc(db, COLLECTION, id), { pdfUrl });
}

/** Delete both the Firestore document and the Storage file */
export async function deleteDevotional(id: string) {
  const devotional = await getDevotionalById(id);
  if (!devotional) throw new Error("Devotional not found");

  // Delete from Storage
  try {
    const storageRef = ref(storage, devotional.storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    // If file doesn't exist any more, continue deleting doc
    console.warn("Storage file may already be deleted:", err);
  }

  // Delete Firestore document
  await deleteDoc(doc(db, COLLECTION, id));
}
