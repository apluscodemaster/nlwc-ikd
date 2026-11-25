import { createHash } from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  detectGoogleImageSource,
  resolveGooglePhotosShareLink,
  toGoogleImageURL,
} from "@/utils/driveImage";

/**
 * Persistent cache of Google Photos share link → direct image URL.
 *
 * The gallery sheets hold ~900 Google Photos *share* links
 * (photos.app.goo.gl/…). Turning one into a displayable image means fetching
 * and scraping its Google Photos page. That used to happen for EVERY link on
 * every build and every 10-minute regeneration (an in-memory cache only, lost
 * with each new server instance) — hundreds of Google requests each time,
 * slow builds, and a real risk of Google throttling the server.
 *
 * Results now live in ONE Firestore document shared by every instance, so a
 * link is resolved once, ever. Each request:
 *  - serves remembered links straight from the cache (one document read);
 *  - resolves new links within a time budget (Netlify/Vercel cut requests off
 *    after ~10s); anything left over is picked up by following requests;
 *  - remembers failures for a while, so a dead link isn't retried constantly;
 *  - re-checks a few of the oldest entries, in case Google ever changes a
 *    URL — never all at once.
 *
 * Server-only (Firebase Admin). Writes merge only the changed entries.
 */

const DOC = { collection: "photo_link_cache", id: "v1" };

/** Stop starting new resolutions after this long, leaving room to respond. */
const DEFAULT_BUDGET_MS = 6_000;
/** Retry a failed link no sooner than this. */
const FAILURE_RETRY_MS = 6 * 60 * 60 * 1000;
/** Successful entries older than this are eligible for a background re-check… */
const REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
/** …at most this many per request. */
const MAX_REFRESH_PER_RUN = 10;

interface CacheEntry {
  /** Resolved direct image URL ("" when the last attempt failed). */
  url: string;
  /** When it was last resolved or attempted (ms). */
  at: number;
}

type CacheMap = Record<string, CacheEntry>;

/** Firestore-safe map key for a share URL. */
function keyFor(shareUrl: string): string {
  return createHash("sha1").update(shareUrl).digest("hex").slice(0, 24);
}

async function loadCache(): Promise<CacheMap> {
  try {
    const snap = await getAdminDb()
      .collection(DOC.collection)
      .doc(DOC.id)
      .get();
    return (snap.data()?.entries as CacheMap | undefined) ?? {};
  } catch (err) {
    console.warn("[photoLinkCache] could not read cache:", err);
    return {};
  }
}

async function saveEntries(updates: CacheMap): Promise<void> {
  if (Object.keys(updates).length === 0) return;
  try {
    await getAdminDb()
      .collection(DOC.collection)
      .doc(DOC.id)
      .set({ entries: updates, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn("[photoLinkCache] could not save cache:", err);
  }
}

export interface ResolveResult {
  /** Input URL → displayable URL ("" = not available yet / failed). */
  urls: Map<string, string>;
  /** Google Photos links still unresolved (budget ran out, or never tried). */
  pending: number;
}

/**
 * Turn sheet image URLs (Drive links, direct lh3 links, Google Photos share
 * links) into displayable URLs, using and updating the shared cache.
 */
export async function resolveImageUrls(
  inputs: string[],
  { budgetMs = DEFAULT_BUDGET_MS }: { budgetMs?: number } = {},
): Promise<ResolveResult> {
  const now = Date.now();
  const deadline = now + budgetMs;
  const urls = new Map<string, string>();

  // Non-Photos links convert without any network call.
  const shareLinks: string[] = [];
  for (const raw of inputs) {
    const url = raw?.trim();
    if (!url || urls.has(url)) continue;
    if (detectGoogleImageSource(url) === "googlephotos") shareLinks.push(url);
    else urls.set(url, toGoogleImageURL(url));
  }
  if (shareLinks.length === 0) return { urls, pending: 0 };

  const cache = await loadCache();
  const toResolve: string[] = [];
  const stale: { url: string; at: number }[] = [];

  for (const link of shareLinks) {
    const entry = cache[keyFor(link)];
    if (!entry) {
      toResolve.push(link);
      urls.set(link, "");
    } else if (!entry.url) {
      // Known failure: retry only after the back-off.
      urls.set(link, "");
      if (now - entry.at > FAILURE_RETRY_MS) toResolve.push(link);
    } else {
      urls.set(link, entry.url);
      if (now - entry.at > REFRESH_AFTER_MS)
        stale.push({ url: link, at: entry.at });
    }
  }

  // New and retry-due links first, then a few of the oldest successes.
  stale.sort((a, b) => a.at - b.at);
  const work = [
    ...toResolve,
    ...stale.slice(0, MAX_REFRESH_PER_RUN).map((s) => s.url),
  ];

  const updates: CacheMap = {};
  let attempted = 0;
  await Promise.all(
    work.map(async (link) => {
      // resolveGooglePhotosShareLink queues behind a shared limit of 6 at a
      // time; re-check the budget once it's this link's turn to run.
      const resolved = await resolveWithinBudget(link, deadline);
      if (resolved === null) return; // budget exhausted — leave for next time
      attempted++;
      const previous = cache[keyFor(link)];
      // A failed refresh keeps the previously working URL.
      if (!resolved && previous?.url) {
        updates[keyFor(link)] = { url: previous.url, at: Date.now() };
        return;
      }
      updates[keyFor(link)] = { url: resolved, at: Date.now() };
      urls.set(link, resolved);
    }),
  );

  await saveEntries(updates);

  const pending = shareLinks.filter((l) => !urls.get(l)).length;
  if (attempted > 0 || pending > 0) {
    console.info(
      `[photoLinkCache] ${shareLinks.length} share links: resolved ${attempted} this request, ${pending} not available yet`,
    );
  }
  return { urls, pending };
}

/** Resolve unless the budget has run out by the time it would start (null). */
function resolveWithinBudget(
  link: string,
  deadline: number,
): Promise<string | null> {
  if (Date.now() >= deadline) return Promise.resolve(null);
  return resolveGooglePhotosShareLink(link, () => Date.now() < deadline).then(
    (r) => (r === undefined ? null : r),
  );
}
