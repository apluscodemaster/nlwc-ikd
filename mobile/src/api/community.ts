import { addDoc, collection, limit, orderBy, query, where, getDocs } from "firebase/firestore";
import { getDb } from "~/lib/firebase";
import { isFirebaseConfigured } from "~/lib/config";
import type { DateColumns, FellowshipCenter } from "~/shared";
import { api } from "./client";

/* ── Fellowship ─────────────────────────────────────────────────────────── */
export const fellowshipApi = {
  centers: async () => (await api.get<{ centers: FellowshipCenter[] }>("/api/fellowship")).centers ?? [],
};

/* ── Gallery ────────────────────────────────────────────────────────────── */
export const galleryApi = {
  dates: async () => (await api.get<{ dates: DateColumns[] }>("/api/sheet")).dates ?? [],
};

/* ── Testimonies ────────────────────────────────────────────────────────── */
export interface TestimonyInput {
  name: string;
  location: string;
  phone: string;
  email: string;
  testimony: string;
  displayPreference: "public" | "private";
}

export interface PublicTestimony {
  id: string;
  name: string;
  location: string;
  testimony: string;
  createdAt: number;
}

export const testimoniesApi = {
  /** Verified, public testimonies (firestore.rules only exposes these). */
  verified: async (): Promise<PublicTestimony[]> => {
    if (!isFirebaseConfigured) return [];
    const snap = await getDocs(
      query(
        collection(getDb(), "testimonies"),
        where("status", "==", "verified"),
        where("displayPreference", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );
    return snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        name: String(v.name ?? ""),
        location: String(v.location ?? ""),
        testimony: String(v.testimony ?? ""),
        createdAt: Number(v.createdAt ?? 0),
      };
    });
  },

  /**
   * Same two steps as the website: save to Firestore (validated by
   * firestore.rules), then notify the church by email via the API. The API's
   * thank-you auto-reply needs a Turnstile token, which the app can't produce
   * yet (docs/ARCHITECTURE.md §7.4), so only the church notification is sent.
   */
  submit: async (input: TestimonyInput): Promise<void> => {
    if (isFirebaseConfigured) {
      await addDoc(collection(getDb(), "testimonies"), { ...input, status: "pending", createdAt: Date.now() });
    }
    try {
      await api.post("/api/testimonies", { ...input, turnstileToken: null });
    } catch (e) {
      // Saved already: the email is best-effort. Without Firestore it's the only path, so surface it.
      if (!isFirebaseConfigured) throw e;
    }
  },
};
