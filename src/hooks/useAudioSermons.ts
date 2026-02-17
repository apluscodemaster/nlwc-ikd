import { useState, useEffect, useCallback } from "react";
import type { AudioSermon, AudioSermonsResponse } from "@/lib/audioSermons";

interface UseAudioSermonsOptions {
  page?: number;
  perPage?: number;
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
  const { page: initialPage = 1, perPage = 10 } = options;

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
        const response = await fetch(
          `/api/audio-sermons?page=${page}&per_page=${perPage}`,
        );

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
    [perPage],
  );

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
