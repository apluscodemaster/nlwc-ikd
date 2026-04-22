/**
 * Testimony Service — Firestore-backed
 *
 * Stores testimony submissions in the `testimonies` Firestore collection.
 * Supports real-time subscriptions for both public (verified-only) and
 * admin (all) views, plus status updates for the verification workflow.
 */

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type TestimonyStatus = "pending" | "verified" | "rejected";
export type DisplayPreference = "public" | "private";

export interface Testimony {
  id: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  testimony: string;
  displayPreference: DisplayPreference;
  status: TestimonyStatus;
  createdAt: number; // Unix ms
  verifiedAt?: number; // Unix ms — when admin approved
}

export interface TestimonySubmission {
  name: string;
  location: string;
  phone: string;
  email: string;
  testimony: string;
  displayPreference: DisplayPreference;
}

const COLLECTION = "testimonies";

// ──────────────────────────────────────────────
// Write operations
// ──────────────────────────────────────────────

/**
 * Submit a new testimony.
 * The testimony is created with `status: "pending"` and must be
 * approved by an admin before it appears publicly.
 */
export async function submitTestimony(
  data: TestimonySubmission,
): Promise<Testimony | null> {
  try {
    const doc_data = {
      name: data.name.trim(),
      location: data.location.trim(),
      phone: data.phone.trim(),
      email: data.email.trim().toLowerCase(),
      testimony: data.testimony.trim(),
      displayPreference: data.displayPreference,
      status: "pending" as TestimonyStatus,
      createdAt: Date.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION), doc_data);

    return {
      id: docRef.id,
      ...doc_data,
    };
  } catch (error) {
    console.error("Failed to submit testimony:", error);
    return null;
  }
}

/**
 * Update a testimony's verification status (admin action).
 */
export async function updateTestimonyStatus(
  id: string,
  status: TestimonyStatus,
): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION, id);
    const updates: Record<string, unknown> = { status };

    if (status === "verified") {
      updates.verifiedAt = Date.now();
    }

    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error("Failed to update testimony status:", error);
    return false;
  }
}

// ──────────────────────────────────────────────
// Real-time subscriptions
// ──────────────────────────────────────────────

/**
 * Subscribe to **verified public** testimonies in real time.
 * Only returns testimonies that are verified AND have displayPreference "public".
 * Used on the public testimonies page.
 */
export function subscribeToVerifiedTestimonies(
  onData: (testimonies: Testimony[]) => void,
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where("status", "==", "verified"),
    where("displayPreference", "==", "public"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const testimonies: Testimony[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Testimony, "id">),
      }));
      onData(testimonies);
    },
    (error) => {
      console.warn("Verified testimonies listener error:", error);
      // Gracefully show empty state on permission errors
      onData([]);
    },
  );
}

/**
 * Subscribe to ALL testimonies in real time (admin view).
 * Returns every testimony regardless of status or display preference,
 * ordered by newest first.
 */
export function subscribeToAllTestimonies(
  onData: (testimonies: Testimony[]) => void,
): () => void {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const testimonies: Testimony[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Testimony, "id">),
      }));
      onData(testimonies);
    },
    (error) => {
      console.warn("All testimonies listener error:", error);
      onData([]);
    },
  );
}

/**
 * Fetch verified public testimonies once (for SSR / initial load).
 */
export async function fetchVerifiedTestimonies(): Promise<Testimony[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("status", "==", "verified"),
      where("displayPreference", "==", "public"),
      orderBy("createdAt", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Testimony, "id">),
    }));
  } catch (error) {
    console.error("Failed to fetch verified testimonies:", error);
    return [];
  }
}
