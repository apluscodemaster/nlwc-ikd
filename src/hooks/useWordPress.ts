"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { TranscriptPost, SundaySchoolManual } from "@/lib/wordpress";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    totalPages: number;
    total: number;
  };
}

interface SingleResponse<T> {
  data: T;
}

// =============================================================================
// API FETCHERS
// =============================================================================

async function fetchTranscripts(
  page = 1,
  perPage = 10,
  search?: string,
): Promise<PaginatedResponse<TranscriptPost>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  if (search) params.append("search", search);

  const response = await fetch(`/api/transcripts?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch transcripts");
  return response.json();
}

async function fetchTranscriptBySlug(
  slug: string,
): Promise<SingleResponse<TranscriptPost>> {
  const response = await fetch(`/api/transcripts/${slug}`);
  if (!response.ok) throw new Error("Failed to fetch transcript");
  return response.json();
}

async function fetchManuals(
  page = 1,
  perPage = 10,
  search?: string,
): Promise<PaginatedResponse<SundaySchoolManual>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  if (search) params.append("search", search);

  const response = await fetch(`/api/manuals?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch manuals");
  return response.json();
}

async function fetchManualBySlug(
  slug: string,
): Promise<SingleResponse<SundaySchoolManual>> {
  const response = await fetch(`/api/manuals/${slug}`);
  if (!response.ok) throw new Error("Failed to fetch manual");
  return response.json();
}

// =============================================================================
// REACT QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch paginated transcripts
 */
export function useTranscripts(
  page = 1,
  perPage = 10,
  search?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["transcripts", page, perPage, search],
    queryFn: () => fetchTranscripts(page, perPage, search),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch infinite scroll transcripts
 */
export function useInfiniteTranscripts(perPage = 10, search?: string) {
  return useInfiniteQuery({
    queryKey: ["transcripts-infinite", perPage, search],
    queryFn: ({ pageParam = 1 }) =>
      fetchTranscripts(pageParam, perPage, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single transcript by slug
 */
export function useTranscript(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["transcript", slug],
    queryFn: () => fetchTranscriptBySlug(slug),
    enabled: enabled && !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch paginated manuals
 */
export function useManuals(
  page = 1,
  perPage = 10,
  search?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["manuals", page, perPage, search],
    queryFn: () => fetchManuals(page, perPage, search),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch infinite scroll manuals
 */
export function useInfiniteManuals(perPage = 10, search?: string) {
  return useInfiniteQuery({
    queryKey: ["manuals-infinite", perPage, search],
    queryFn: ({ pageParam = 1 }) => fetchManuals(pageParam, perPage, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single manual by slug
 */
export function useManual(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["manual", slug],
    queryFn: () => fetchManualBySlug(slug),
    enabled: enabled && !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

// =============================================================================
// SERMONS TYPES & HOOKS
// =============================================================================

export interface Sermon {
  id: number;
  title: string;
  speaker: string;
  date: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  type: string;
  link: string;
}

interface SermonsResponse {
  sermons: Sermon[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

async function fetchSermons(
  page = 1,
  perPage = 9,
  search?: string,
): Promise<SermonsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    perPage: perPage.toString(),
  });
  if (search) params.append("search", search);

  const response = await fetch(`/api/sermons?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch sermons");
  return response.json();
}

/**
 * Hook to fetch paginated sermons
 */
export function useSermons(
  page = 1,
  perPage = 9,
  search?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["sermons", page, perPage, search],
    queryFn: () => fetchSermons(page, perPage, search),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
