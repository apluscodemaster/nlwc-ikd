import { getMediaProgress, type MediaProgress } from "~/shared";
import { kv } from "~/lib/storage";

/** Same index key the website's lib/mediaProgress maintains (module-private there). */
const PROGRESS_INDEX_KEY = "nlwc-media-progress-index";

/** Most recently saved, unfinished audio progress entries (newest first). */
export function getRecentProgress(max = 3): MediaProgress[] {
  const ids = kv.getJSON<(string | number)[]>(PROGRESS_INDEX_KEY) ?? [];
  return ids
    .map((id) => getMediaProgress(id))
    .filter((p): p is MediaProgress => !!p && p.type === "audio")
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, max);
}
