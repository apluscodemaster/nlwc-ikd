"use client";

import { useEffect, useState } from "react";

/**
 * The `?q=` search term, read in the browser after mount.
 *
 * Transcript and manual detail pages highlight the term a visitor searched
 * for. Reading it on the server (`await searchParams`) made those pages fully
 * dynamic — every view re-rendered the sermon HTML instead of serving the
 * cached page. Reading it here keeps the pages cacheable; the first render is
 * always the plain (cached) content, and highlighting applies right after.
 * Deliberately not `useSearchParams()`, which would need a Suspense boundary
 * and drop the content from the server-rendered HTML.
 */
export function useUrlSearchQuery(param = "q"): string {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get(param);
    setQuery(value?.trim() ?? "");
  }, [param]);
  return query;
}
