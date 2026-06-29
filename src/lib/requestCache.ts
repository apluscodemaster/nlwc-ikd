/**
 * Request Deduplication Cache
 *
 * Prevents duplicate API calls for the same query within a 1-minute window.
 * Multiple concurrent requests for the same endpoint return the same cached promise.
 *
 * Each caller receives a **cloned** Response so that `.json()` / `.text()` can
 * be called independently without "body already read" errors.
 *
 * TTL: 1 minute (60,000 ms)
 */

interface CacheEntry {
  /** Resolves to a Response that is ONLY used as a clone source — never consumed directly. */
  promise: Promise<Response>;
  timestamp: number;
}

const REQUEST_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // 1 minute

/**
 * Generate a cache key from the request URL and method
 */
function getCacheKey(url: string, method: string = "GET"): string {
  return `${method}:${url}`;
}

/**
 * Check if a cached entry is still valid (within TTL)
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Wrap a fetch call with request deduplication.
 *
 * Returns a **cloned** Response on every call so each consumer can safely read
 * the body independently. The original Response is kept in the cache as the
 * clone source and is never consumed directly.
 */
export async function deduplicatedFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const method = options?.method || "GET";
  const cacheKey = getCacheKey(url, method);

  // Check for existing cached promise
  const cachedEntry = REQUEST_CACHE.get(cacheKey);
  if (cachedEntry && isCacheValid(cachedEntry)) {
    // Clone so the caller gets its own consumable body stream
    const cached = await cachedEntry.promise;
    return cached.clone();
  }

  // Clean up expired entry if present
  if (cachedEntry && !isCacheValid(cachedEntry)) {
    REQUEST_CACHE.delete(cacheKey);
  }

  // Create new promise and cache it
  const promise = fetch(url, options).catch((error) => {
    // Remove from cache on error to allow retries
    REQUEST_CACHE.delete(cacheKey);
    throw error;
  });

  REQUEST_CACHE.set(cacheKey, {
    promise,
    timestamp: Date.now(),
  });

  // Clone the first response too — the cached promise's Response is reserved
  // as the clone source and must never be consumed directly.
  const response = await promise;
  return response.clone();
}

/**
 * Clear all expired entries (call this periodically)
 */
export function cleanupExpiredCache(): number {
  let cleaned = 0;
  for (const [key, entry] of REQUEST_CACHE.entries()) {
    if (!isCacheValid(entry)) {
      REQUEST_CACHE.delete(key);
      cleaned++;
    }
  }
  return cleaned;
}

// Periodic cleanup (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredCache, 300000);
}
