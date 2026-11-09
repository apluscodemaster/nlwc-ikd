import { useQuery } from "@tanstack/react-query";
import { ApiError } from "~/api/client";
import { videoApi } from "~/api/video";

export function useVideoMessages() {
  return useQuery({
    queryKey: ["video-messages"],
    queryFn: ({ signal }) => videoApi.messages(signal),
    staleTime: 15 * 60 * 1000,
  });
}

/** The live-stream link; `null` when the admin hasn't set one (API 404). */
export function useVideoStream(enabled = true) {
  return useQuery({
    queryKey: ["video-stream"],
    enabled,
    staleTime: 60 * 1000,
    refetchInterval: enabled ? 2 * 60 * 1000 : false,
    queryFn: async ({ signal }) => {
      try {
        return await videoApi.stream(signal);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });
}
