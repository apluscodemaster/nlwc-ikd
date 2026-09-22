"use client";

import { useQuery } from "@tanstack/react-query";
import { fellowshipCenters, type FellowshipCenter } from "@/data/centers";

/**
 * Fellowship centers as managed in /admin/fellowship (Firestore, via
 * /api/fellowship). The static list in data/centers.ts paints instantly as
 * placeholder data and stays in place if the API is unreachable; once the
 * request resolves the admin-managed list takes over.
 */
export function useFellowshipCenters({ enabled = true }: { enabled?: boolean } = {}) {
  const query = useQuery<FellowshipCenter[]>({
    queryKey: ["fellowship-centers"],
    queryFn: async () => {
      const res = await fetch("/api/fellowship");
      if (!res.ok) throw new Error("Failed to load fellowship centers");
      const data = (await res.json()) as { centers?: FellowshipCenter[] };
      return data.centers ?? [];
    },
    placeholderData: fellowshipCenters,
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  // placeholderData only covers the pending state; a failed request would
  // otherwise leave the page empty, so fall back to the static list there too.
  const centers =
    query.isError || !query.data ? fellowshipCenters : query.data;

  return { ...query, centers };
}
