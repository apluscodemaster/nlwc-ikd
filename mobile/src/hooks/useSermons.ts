import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { sermonsApi, type AudioSermonQuery } from "~/api/sermons";
import { transcriptStubsApi } from "~/api/transcripts";
import { findTranscriptSlug, type AudioSermon } from "~/shared";

const DAY = 24 * 60 * 60 * 1000;

export const sermonKeys = {
  list: (q: Omit<AudioSermonQuery, "page">) => ["audio-sermons", "list", q] as const,
  detail: (id: number) => ["audio-sermons", "detail", id] as const,
  filters: (type: "series" | "speakers") => ["audio-sermons", "filters", type] as const,
};

/** Paginated audio messages with infinite scroll (port of useAudioSermons). */
export function useSermonList(q: Omit<AudioSermonQuery, "page">, opts: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: sermonKeys.list(q),
    enabled: opts.enabled ?? true,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => sermonsApi.list({ ...q, page: pageParam, perPage: q.perPage ?? 15 }, signal),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });
}

export function useSermonDetail(id: number | undefined, initial?: AudioSermon) {
  return useQuery({
    queryKey: sermonKeys.detail(id ?? 0),
    enabled: !!id,
    queryFn: ({ signal }) => sermonsApi.detail(id!, signal),
    placeholderData: initial,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSermonFilters() {
  const series = useQuery({ queryKey: sermonKeys.filters("series"), queryFn: sermonsApi.series, staleTime: DAY });
  const speakers = useQuery({ queryKey: sermonKeys.filters("speakers"), queryFn: sermonsApi.speakers, staleTime: DAY });
  return { series: series.data ?? [], speakers: speakers.data ?? [] };
}

export function useTranscriptStubs() {
  return useQuery({
    queryKey: ["transcript-stubs"],
    queryFn: transcriptStubsApi.stubs,
    staleTime: 60 * 60 * 1000,
  });
}

/** The transcript slug for a sermon, matched by title and preached date (web parity). */
export function useTranscriptForSermon(sermon: AudioSermon | undefined): string | null {
  const { data } = useTranscriptStubs();
  if (!sermon || !data?.length) return null;
  return findTranscriptSlug(sermon.title, data, sermon.id, sermon.date);
}
