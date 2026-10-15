import { revalidatePath } from "next/cache";

export type RevalidateTarget = { path: string; kind?: "page" | "layout" };

/**
 * The cached surfaces affected by each content type. Detail routes use the
 * "[slug]"/"[id]" form so every cached detail page is refreshed. Shared by the
 * WordPress webhook (/api/revalidate) and the release-refresh cron job.
 */
export const TARGETS_BY_TYPE: Record<string, RevalidateTarget[]> = {
  transcript: [
    { path: "/transcripts" },
    { path: "/transcripts/[slug]", kind: "page" },
    { path: "/sermons" }, // sermon ↔ transcript matching surface
    { path: "/api/wp/transcript-slugs" }, // cached matching data
  ],
  manual: [
    { path: "/manuals" },
    { path: "/manuals/[slug]", kind: "page" },
  ],
  sermon: [
    { path: "/sermons" },
    { path: "/sermons/audio/[id]", kind: "page" },
  ],
};

/**
 * Mark each target stale. A single path failing (e.g. under Turbopack in dev)
 * never stops the rest. Returns the paths that were revalidated.
 */
export function revalidateTargets(targets: RevalidateTarget[]): string[] {
  const revalidated: string[] = [];
  for (const t of targets) {
    try {
      if (t.kind) revalidatePath(t.path, t.kind);
      else revalidatePath(t.path);
      revalidated.push(t.path);
    } catch (err) {
      console.warn(`[Revalidate] Failed for ${t.path}:`, err);
    }
  }
  return revalidated;
}
