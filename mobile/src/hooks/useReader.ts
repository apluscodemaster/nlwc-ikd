import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { devotionalsApi } from "~/api/devotionals";
import { manualsApi, scriptureApi, transcriptsApi } from "~/api/reader";
import { isFirebaseConfigured } from "~/lib/config";

const HOUR = 60 * 60 * 1000;

export function useTranscriptList(q: { search?: string; category?: number }) {
  return useInfiniteQuery({
    queryKey: ["transcripts", "list", q],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => transcriptsApi.list({ ...q, page: pageParam }, signal),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });
}

export function useTranscript(slug: string | undefined) {
  return useQuery({
    queryKey: ["transcripts", "detail", slug],
    enabled: !!slug,
    queryFn: ({ signal }) => transcriptsApi.detail(slug!, signal),
    staleTime: HOUR / 2,
  });
}

export function useTranscriptCategories() {
  return useQuery({ queryKey: ["transcript-categories"], queryFn: transcriptsApi.categories, staleTime: 24 * HOUR });
}

export function useManualList(search?: string) {
  return useInfiniteQuery({
    queryKey: ["manuals", "list", search ?? ""],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => manualsApi.list({ page: pageParam, search }, signal),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });
}

export function useManual(slug: string | undefined) {
  return useQuery({
    queryKey: ["manuals", "detail", slug],
    enabled: !!slug,
    queryFn: ({ signal }) => manualsApi.detail(slug!, signal),
    staleTime: HOUR / 2,
  });
}

export function useManualThemes() {
  return useQuery({ queryKey: ["manual-themes"], queryFn: manualsApi.themes, staleTime: 24 * HOUR });
}

export function useManualAdjacent(date: string | undefined, slug: string | undefined) {
  return useQuery({
    queryKey: ["manuals", "adjacent", slug],
    enabled: !!date && !!slug,
    queryFn: () => manualsApi.adjacent(date!, slug!),
    staleTime: HOUR,
  });
}

export function useScripture(reference: string | null) {
  return useQuery({
    queryKey: ["scripture", reference],
    enabled: !!reference,
    queryFn: ({ signal }) => scriptureApi.verse(reference!, signal),
    staleTime: Infinity,
    gcTime: 7 * 24 * HOUR,
  });
}

export function useLatestDevotional() {
  return useQuery({ queryKey: ["devotionals", "latest"], queryFn: devotionalsApi.latest, staleTime: 5 * 60 * 1000 });
}

export function useDevotionalArchive() {
  return useInfiniteQuery({
    queryKey: ["devotionals", "archive"],
    enabled: isFirebaseConfigured,
    initialPageParam: null as QueryDocumentSnapshot | null,
    queryFn: ({ pageParam }) => devotionalsApi.page(pageParam),
    getNextPageParam: (last) => (last.hasMore ? last.cursor : undefined),
    // Firestore cursors can't be serialised: keep this query out of the persisted cache.
    meta: { persist: false },
  });
}

export function useDevotional(id: string | undefined) {
  return useQuery({
    queryKey: ["devotionals", "detail", id],
    enabled: !!id && isFirebaseConfigured,
    queryFn: () => devotionalsApi.detail(id!),
  });
}
