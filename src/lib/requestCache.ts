/**
 * Request Deduplication Cache
 *
 * Prevents duplicate API calls for the same query within a 1-minute window.
 * Multiple concurrent requests for the same endpoint return the same cached promise.
 *
 * TTL: 1 minute (60,000 ms)
 */

interface CacheEntry {
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
 * Wrap a fetch call with request deduplication
 * Returns cached promise if same request is in-flight, otherwise caches new promise
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
    return cachedEntry.promise;
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

  return promise;
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
