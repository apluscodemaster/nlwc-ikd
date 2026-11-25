import { cache } from "react";
import { getAdjacentDevotionals, getDevotionalById } from "@/lib/devotionals";

/** What the devotional page renders (plain data: crosses to the client). */
export interface DevotionalViewData {
  id: string;
  title: string;
  pdfUrl: string;
  /** ISO date-time. */
  scheduledAt: string;
}

export interface DevotionalLink {
  id: string;
  title: string;
}

/**
 * One Firestore read per request, shared by generateMetadata (layout.tsx) and
 * the page; it used to be read on the server for the metadata and again in
 * the browser for the page.
 */
export const loadDevotional = cache((id: string) => getDevotionalById(id));

/** The devotional and its previous/next neighbours, or null if it doesn't exist. */
export const loadDevotionalPage = cache(async (id: string) => {
  const d = await loadDevotional(id);
  if (!d) return null;
  const { prev, next } = await getAdjacentDevotionals(d.scheduledDate);
  const link = (x: typeof prev): DevotionalLink | null =>
    x ? { id: x.id, title: x.title } : null;
  return {
    devotional: {
      id: d.id,
      title: d.title,
      pdfUrl: d.pdfUrl,
      scheduledAt: d.scheduledDate.toDate().toISOString(),
    } satisfies DevotionalViewData,
    prev: link(prev),
    next: link(next),
  };
});
