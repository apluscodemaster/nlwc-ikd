import { slugify } from "@/lib/slugify";

/**
 * Pure (client-safe) helpers for shareable video-message links. Kept separate
 * from videoMessages.ts so the client bundle never pulls in server-only code.
 */

type SluggableVideo = { title?: string; id: string };

/**
 * Human-readable, guaranteed-unique slug: "<title-slug>-<youtube-id>".
 * Falls back to the bare YouTube id for messages without a title.
 */
export function videoSlug(video: SluggableVideo): string {
  const base = slugify(video.title || "");
  return base ? `${base}-${video.id}` : video.id;
}

/**
 * Resolve a shareable slug back to a video. Accepts the canonical
 * "<title-slug>-<id>" form, a bare id (legacy ?v=<id> links), and a bare
 * title-slug (older links without the id suffix).
 */
export function findVideoBySlug<T extends SluggableVideo>(
  videos: T[],
  slug: string,
): T | undefined {
  return videos.find(
    (v) =>
      videoSlug(v) === slug ||
      v.id === slug ||
      slugify(v.title || "") === slug,
  );
}
