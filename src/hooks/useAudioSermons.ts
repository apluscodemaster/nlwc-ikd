import { useState, useEffect, useCallback } from "react";
import type {
  AudioSermon,
  AudioSermonsResponse,
  AudioSermonsFilters,
  SeriesItem,
  SpeakerItem,
  TopicItem,
} from "@/lib/audioSermons";

// =============================================================================
// Sermons Hook (with filters)
// =============================================================================

interface UseAudioSermonsOptions {
  page?: number;
  perPage?: number;
  search?: string;
  seriesId?: number;
  speakerId?: number;
  topicId?: number;
  order?: "ASC" | "DESC";
}

interface UseAudioSermonsResult {
  sermons: AudioSermon[];
  isLoading: boolean;
  error: string | null;
  pagination: AudioSermonsResponse["pagination"] | null;
  fetchPage: (page: number) => void;
  fetchSermonDetail: (messageId: number) => Promise<AudioSermon | null>;
}

export function useAudioSermons(
  options: UseAudioSermonsOptions = {},
): UseAudioSermonsResult {
  const {
    page: initialPage = 1,
    perPage = 12,
    search,
    seriesId,
    speakerId,
    topicId,
    order = "DESC",
  } = options;

  const [sermons, setSermons] = useState<AudioSermon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    AudioSermonsResponse["pagination"] | null
  >(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchSermons = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: perPage.toString(),
          order,
        });
        if (search) params.set("search", search);
        if (seriesId) params.set("series_id", seriesId.toString());
        if (speakerId) params.set("speaker_id", speakerId.toString());
        if (topicId) params.set("topic_id", topicId.toString());

        const response = await fetch(`/api/audio-sermons?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch audio sermons");
        }

        const data: AudioSermonsResponse = await response.json();
        setSermons(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
        setSermons([]);
      } finally {
        setIsLoading(false);
      }
    },
    [perPage, search, seriesId, speakerId, topicId, order],
  );

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, seriesId, speakerId, topicId, order]);

  useEffect(() => {
    fetchSermons(currentPage);
  }, [currentPage, fetchSermons]);

  const fetchPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const fetchSermonDetail = useCallback(
    async (messageId: number): Promise<AudioSermon | null> => {
      try {
        const response = await fetch(
          `/api/audio-sermons?message_id=${messageId}`,
        );
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    sermons,
    isLoading,
    error,
    pagination,
    fetchPage,
    fetchSermonDetail,
  };
}

// =============================================================================
// Filter Options Hooks
// =============================================================================

export function useFilterOptions() {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFilterOptions() {
      setIsLoading(true);
      try {
        const [seriesRes, speakersRes, topicsRes] = await Promise.allSettled([
          fetch("/api/audio-sermons/filters?type=series"),
          fetch("/api/audio-sermons/filters?type=speakers"),
          fetch("/api/audio-sermons/filters?type=topics"),
        ]);

        if (seriesRes.status === "fulfilled" && seriesRes.value.ok) {
          setSeries(await seriesRes.value.json());
        }
        if (speakersRes.status === "fulfilled" && speakersRes.value.ok) {
          setSpeakers(await speakersRes.value.json());
        }
        if (topicsRes.status === "fulfilled" && topicsRes.value.ok) {
          setTopics(await topicsRes.value.json());
        }
      } catch {
        // Filters are optional, gracefully handle errors
      } finally {
        setIsLoading(false);
      }
    }

    fetchFilterOptions();
  }, []);

  return { series, speakers, topics, isLoading };
}
