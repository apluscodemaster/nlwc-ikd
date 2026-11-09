import type { BibleVerse, SundaySchoolManual, TranscriptCategory, TranscriptPost } from "~/shared";
import { api } from "./client";

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; perPage: number; totalPages: number; total: number };
}

export interface AdjacentLinks {
  previous: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
}

export const transcriptsApi = {
  list: (q: { page: number; perPage?: number; search?: string; category?: number }, signal?: AbortSignal) =>
    api.get<Paginated<TranscriptPost>>(
      "/api/transcripts",
      { page: q.page, per_page: q.perPage ?? 12, search: q.search, category: q.category },
      signal,
    ),
  detail: async (slug: string, signal?: AbortSignal) =>
    (await api.get<{ data: TranscriptPost }>(`/api/transcripts/${encodeURIComponent(slug)}`, undefined, signal)).data,
  categories: async () =>
    (await api.get<{ categories: TranscriptCategory[] }>("/api/wp/transcript-categories")).categories ?? [],
};

export const manualsApi = {
  list: (q: { page: number; perPage?: number; search?: string }, signal?: AbortSignal) =>
    api.get<Paginated<SundaySchoolManual>>(
      "/api/manuals",
      { page: q.page, per_page: q.perPage ?? 12, search: q.search },
      signal,
    ),
  detail: async (slug: string, signal?: AbortSignal) =>
    (await api.get<{ data: SundaySchoolManual }>(`/api/manuals/${encodeURIComponent(slug)}`, undefined, signal)).data,
  themes: async () => (await api.get<{ themes: string[] }>("/api/manuals/themes")).themes ?? [],
  adjacent: (date: string, slug: string) => api.get<AdjacentLinks>("/api/manuals/adjacent", { date, slug }),
};

export const scriptureApi = {
  verse: (reference: string, signal?: AbortSignal) =>
    api.get<BibleVerse>(`/api/scripture/${encodeURIComponent(reference)}`, undefined, signal),
};
