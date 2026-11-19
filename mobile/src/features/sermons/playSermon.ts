import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { sermonsApi } from "~/api/sermons";
import { sermonKeys } from "~/hooks/useSermons";
import { usePlayer } from "~/player/PlayerProvider";
import type { Track } from "~/player/types";
import { toStreamableAudioUrl, type AudioSermon } from "~/shared";

/** `url` may be empty for queued listings; the player resolves it when needed. */
export function sermonToTrack(s: AudioSermon, url: string | undefined): Track {
  return {
    id: s.id,
    title: s.title,
    artist: s.speaker,
    album: s.series,
    artwork: s.thumbnailUrl,
    url: url ? toStreamableAudioUrl(url) : "",
    href: `/sermons/${s.id}`,
  };
}

/**
 * Returns a function that plays a sermon. Listings don't always carry the
 * audio URL (`downloadUrl`), so it is fetched from the detail endpoint when
 * missing, as the website does.
 *
 * Pass the list it was played from (`queue`) to carry on through that list
 * when the message finishes (auto-play-next, as on the website).
 */
export function usePlaySermon() {
  const { play } = usePlayer();
  const qc = useQueryClient();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const fetchUrl = useCallback(
    async (id: number): Promise<string | undefined> => {
      try {
        const detail = await qc.fetchQuery({
          queryKey: sermonKeys.detail(id),
          queryFn: () => sermonsApi.detail(id),
          staleTime: 60 * 60 * 1000,
        });
        return detail.downloadUrl || undefined;
      } catch {
        return undefined;
      }
    },
    [qc],
  );

  /** For queued messages whose listing had no URL. */
  const resolveUrl = useCallback(
    async (id: number | string): Promise<string | null> => {
      const url = await fetchUrl(Number(id));
      return url ? toStreamableAudioUrl(url) : null;
    },
    [fetchUrl],
  );

  const playSermon = useCallback(
    async (s: AudioSermon, queue?: AudioSermon[]) => {
      let url = s.downloadUrl;
      if (!url) {
        setLoadingId(s.id);
        url = await fetchUrl(s.id);
        setLoadingId(null);
      }
      if (!url) {
        Alert.alert("Can't play this message", "The audio for this message isn't available right now.");
        return;
      }
      play(
        sermonToTrack(s, url),
        queue ? { queue: queue.map((q) => sermonToTrack(q, q.downloadUrl)), resolveUrl } : undefined,
      );
    },
    [play, fetchUrl, resolveUrl],
  );

  return { playSermon, loadingId };
}
