import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { sermonsApi } from "~/api/sermons";
import { sermonKeys } from "~/hooks/useSermons";
import { usePlayer } from "~/player/PlayerProvider";
import type { Track } from "~/player/types";
import { toStreamableAudioUrl, type AudioSermon } from "~/shared";

export function sermonToTrack(s: AudioSermon, url: string): Track {
  return {
    id: s.id,
    title: s.title,
    artist: s.speaker,
    album: s.series,
    artwork: s.thumbnailUrl,
    url: toStreamableAudioUrl(url),
    href: `/sermons/${s.id}`,
  };
}

/**
 * Returns a function that plays a sermon. Listings don't always carry the
 * audio URL (`downloadUrl`), so it is fetched from the detail endpoint when
 * missing, as the website does.
 */
export function usePlaySermon() {
  const { play } = usePlayer();
  const qc = useQueryClient();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const playSermon = useCallback(
    async (s: AudioSermon) => {
      let url = s.downloadUrl;
      if (!url) {
        setLoadingId(s.id);
        try {
          const detail = await qc.fetchQuery({
            queryKey: sermonKeys.detail(s.id),
            queryFn: () => sermonsApi.detail(s.id),
            staleTime: 60 * 60 * 1000,
          });
          url = detail.downloadUrl;
        } catch {
          url = undefined;
        } finally {
          setLoadingId(null);
        }
      }
      if (!url) {
        Alert.alert("Can't play this message", "The audio for this message isn't available right now.");
        return;
      }
      play(sermonToTrack(s, url));
    },
    [play, qc],
  );

  return { playSermon, loadingId };
}
