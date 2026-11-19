import { Alert } from "react-native";
import { CheckCircle2, Download, X } from "~/components/icons";
import { Button, IconButton } from "~/components";
import type { Track } from "~/player/types";
import { cancelDownload, downloadSermon, removeDownload, useDownloads, wasCancelled } from "./downloads";

/**
 * Save a message for offline listening. `compact` is an icon for the full
 * player's toolbar; otherwise a labelled button for the message page.
 */
export function DownloadButton({ track, compact }: { track: Track | null; compact?: boolean }) {
  const { items, active } = useDownloads();
  if (!track || track.isLive) return null;
  const id = String(track.id);
  const progress = active[id];
  const saved = items.some((d) => d.id === id);
  const canDownload = /^https?:\/\//i.test(track.url);

  const onPress = () => {
    if (progress !== undefined) return cancelDownload(id);
    if (saved) {
      Alert.alert("Remove download?", `"${track.title}" will need data to play again.`, [
        { text: "Keep", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeDownload(id) },
      ]);
      return;
    }
    void downloadSermon(track).then((ok) => {
      // Cancelling also resolves false; only say something for a real failure.
      if (!ok && !wasCancelled(id)) {
        Alert.alert("Download failed", "Check your connection and try again.");
      }
    });
  };

  const label =
    progress !== undefined ? `Downloading ${Math.round(progress * 100)}%` : saved ? "Downloaded" : "Download";

  if (compact) {
    return (
      <IconButton
        icon={progress !== undefined ? X : saved ? CheckCircle2 : Download}
        accessibilityLabel={
          progress !== undefined
            ? `${label}. Tap to cancel`
            : saved
              ? "Downloaded. Tap to remove"
              : "Download for offline"
        }
        onPress={onPress}
        disabled={!canDownload && !saved}
        color={saved ? "primary" : undefined}
      />
    );
  }

  return (
    <Button
      title={progress !== undefined ? `${label} · Cancel` : saved ? "Downloaded" : "Download"}
      variant="secondary"
      icon={progress !== undefined ? X : saved ? CheckCircle2 : Download}
      onPress={onPress}
      disabled={!canDownload && !saved}
    />
  );
}
