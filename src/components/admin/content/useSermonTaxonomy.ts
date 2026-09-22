"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/authClient";
import type { SpeakerItem, SeriesItem } from "./types";

type TaxonomyKind = "speaker" | "series";

interface CreateResponse<T> {
  success: boolean;
  item?: T;
  error?: string;
  /** Returned on 409 — the row that already has this name/title. */
  existing?: T;
}

/**
 * Ministers and series for the sermon forms, plus the one code path that adds
 * new ones. Both create calls write to the Series Engine tables through
 * /api/wp/speakers, so anything added here appears in wp-admin → Series
 * Engine exactly as if it had been added there.
 *
 * A duplicate is not an error from the admin's point of view — the existing
 * row is returned and selected, which is what they wanted anyway.
 */
export function useSermonTaxonomy() {
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [loadingSpeakers, setLoadingSpeakers] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);

  const fetchSpeakers = useCallback(async (fresh = false) => {
    setLoadingSpeakers(true);
    try {
      const res = await fetch(`/api/wp/speakers${fresh ? "?fresh=1" : ""}`, {
        cache: fresh ? "no-store" : "default",
      });
      const data = await res.json();
      if (data.speakers) setSpeakers(data.speakers);
    } catch {
      console.error("Failed to load speakers");
    } finally {
      setLoadingSpeakers(false);
    }
  }, []);

  const fetchSeries = useCallback(async (fresh = false) => {
    setLoadingSeries(true);
    try {
      const res = await fetch(
        `/api/wp/speakers?type=series${fresh ? "&fresh=1" : ""}`,
        { cache: fresh ? "no-store" : "default" },
      );
      const data = await res.json();
      if (data.series) setSeriesList(data.series);
    } catch {
      console.error("Failed to load series");
    } finally {
      setLoadingSeries(false);
    }
  }, []);

  useEffect(() => {
    fetchSpeakers();
    fetchSeries();
  }, [fetchSpeakers, fetchSeries]);

  /**
   * Create a row and merge it into the local list immediately (so the select
   * can show it without waiting), then refresh from WordPress in the
   * background so message counts and ordering are authoritative.
   */
  const create = useCallback(
    async <T extends { id: number }>(
      kind: TaxonomyKind,
      body: Record<string, string>,
      label: string,
    ): Promise<T | null> => {
      try {
        const res = await authFetch("/api/wp/speakers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: kind, ...body }),
        });
        const data = (await res.json()) as CreateResponse<T>;

        if (res.status === 409 && data.existing) {
          toast.info(`"${label}" already exists`, {
            description: "Selected the existing entry instead.",
          });
          return data.existing;
        }
        if (!res.ok || !data.success || !data.item) {
          toast.error(`Could not add ${kind}`, {
            description: data.error || `Server returned ${res.status}`,
          });
          return null;
        }

        toast.success(`${kind === "speaker" ? "Minister" : "Series"} added`, {
          description: `"${label}" is now available in WordPress too.`,
        });
        return data.item;
      } catch (err) {
        toast.error(`Could not add ${kind}`, {
          description:
            err instanceof Error ? err.message : "Could not reach the server.",
        });
        return null;
      }
    },
    [],
  );

  const addSpeaker = useCallback(
    async (name: string): Promise<SpeakerItem | null> => {
      const item = await create<SpeakerItem>("speaker", { name }, name);
      if (item) {
        setSpeakers((prev) =>
          prev.some((s) => s.id === item.id) ? prev : [...prev, item],
        );
        void fetchSpeakers(true);
      }
      return item;
    },
    [create, fetchSpeakers],
  );

  const addSeries = useCallback(
    async (title: string): Promise<SeriesItem | null> => {
      const item = await create<SeriesItem>("series", { title }, title);
      if (item) {
        setSeriesList((prev) =>
          prev.some((s) => s.id === item.id) ? prev : [item, ...prev],
        );
        void fetchSeries(true);
      }
      return item;
    },
    [create, fetchSeries],
  );

  /** Series Engine id for a speaker name chosen in the dropdown, if known. */
  const speakerIdFor = useCallback(
    (name: string): number | undefined =>
      speakers.find((s) => s.name === name)?.id,
    [speakers],
  );

  return {
    speakers,
    seriesList,
    loadingSpeakers,
    loadingSeries,
    addSpeaker,
    addSeries,
    speakerIdFor,
  };
}
