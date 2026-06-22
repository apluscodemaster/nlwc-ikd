import type { SearchResult } from "@/types/bible";

/**
 * Retained for compatibility with the search UI. The KJV search is now served
 * by the API.Bible proxy (/api/bible/search), so there is nothing to preload.
 */
export function initBibleSearch(): Promise<void> {
  return Promise.resolve();
}

/**
 * Search the KJV via the server-side API.Bible proxy. Handles both keyword
 * queries ("good shepherd") and references ("John 3:16"). Pass an AbortSignal
 * to cancel an in-flight request when the user keeps typing.
 */
export async function searchBible(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const res = await fetch(`/api/bible/search?q=${encodeURIComponent(q)}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);

  const json = await res.json();
  return Array.isArray(json.results) ? (json.results as SearchResult[]) : [];
}
