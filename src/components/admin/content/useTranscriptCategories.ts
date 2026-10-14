"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/authClient";
import type { TranscriptCategoryItem } from "./types";

const ENDPOINT = "/api/wp/transcript-categories";

/**
 * Transcript categories for the transcript forms, plus the one code path that
 * adds new ones. A new category is created in WordPress as a child of the
 * "Transcripts" category (via /api/wp/transcript-categories), so it shows in
 * wp-admin → Posts → Categories and on the public transcripts page.
 *
 * Same behaviour as the minister/series flow in useSermonTaxonomy: a duplicate
 * isn't an error — the existing category is returned and selected.
 */
export function useTranscriptCategories() {
  const [categories, setCategories] = useState<TranscriptCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  /** `fresh` skips every cache layer so a just-created category shows up. */
  const fetchCategories = useCallback(async (fresh = false) => {
    setLoading(true);
    try {
      const res = fresh
        ? await authFetch(`${ENDPOINT}?fresh=1`, { cache: "no-store" })
        : await fetch(ENDPOINT);
      const data = await res.json();
      if (Array.isArray(data.categories)) setCategories(data.categories);
    } catch {
      console.error("Failed to load transcript categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(
    async (name: string): Promise<TranscriptCategoryItem | null> => {
      try {
        const res = await authFetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          item?: TranscriptCategoryItem;
          existing?: TranscriptCategoryItem;
          error?: string;
        };

        let item: TranscriptCategoryItem | null = null;
        if (res.status === 409 && data.existing) {
          toast.info(`"${name}" already exists`, {
            description: "Selected the existing category instead.",
          });
          item = data.existing;
        } else if (!res.ok || !data.success || !data.item) {
          toast.error("Could not add category", {
            description: data.error || `Server returned ${res.status}`,
          });
          return null;
        } else {
          toast.success("Category added", {
            description: `"${name}" is now available in WordPress too.`,
          });
          item = data.item;
        }

        const added = item;
        setCategories((prev) =>
          prev.some((c) => c.id === added.id) ? prev : [...prev, added],
        );
        void fetchCategories(true);
        return added;
      } catch (err) {
        toast.error("Could not add category", {
          description:
            err instanceof Error ? err.message : "Could not reach the server.",
        });
        return null;
      }
    },
    [fetchCategories],
  );

  return { categories, loading, addCategory };
}
