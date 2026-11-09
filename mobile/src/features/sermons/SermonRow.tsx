import { memo } from "react";
import { ActivityIndicator, View } from "react-native";
import { Pause, Play } from "lucide-react-native";
import { IconButton, ListRow } from "~/components";
import { usePlayer, usePlayerStatus } from "~/player/PlayerProvider";
import { getMediaProgress, parseSermonPart, type AudioSermon } from "~/shared";
import { useTheme } from "~/theme";

interface SermonRowProps {
  sermon: AudioSermon;
  onOpen: (s: AudioSermon) => void;
  onPlay: (s: AudioSermon) => void;
  loading?: boolean;
}

function SermonRowBase({ sermon, onOpen, onPlay, loading }: SermonRowProps) {
  const { colors } = useTheme();
  const { track, toggle } = usePlayer();
  const isCurrent = track?.id === sermon.id;
  const saved = getMediaProgress(sermon.id);
  const progress = saved && saved.duration > 0 ? saved.currentTime / saved.duration : undefined;
  const part = parseSermonPart(sermon.title);

  const meta = [sermon.date, sermon.duration, part ? `Part ${part.part}` : null].filter(Boolean).join(" · ");

  return (
    <ListRow
      title={sermon.title}
      subtitle={sermon.speaker}
      meta={meta}
      thumbnail={sermon.thumbnailUrl}
      progress={progress}
      onPress={() => onOpen(sermon)}
      trailing={
        loading ? (
          <View style={{ width: 44, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isCurrent ? (
          <CurrentToggle title={sermon.title} onToggle={toggle} />
        ) : (
          <IconButton
            icon={Play}
            color="primary"
            accessibilityLabel={`Play ${sermon.title}`}
            onPress={() => onPlay(sermon)}
          />
        )
      }
    />
  );
}

/** Separate component so only the playing row re-renders on status ticks. */
function CurrentToggle({ title, onToggle }: { title: string; onToggle: () => void }) {
  const { playing } = usePlayerStatus();
  return (
    <IconButton
      icon={playing ? Pause : Play}
      color="primary"
      accessibilityLabel={playing ? `Pause ${title}` : `Play ${title}`}
      onPress={onToggle}
    />
  );
}

export const SermonRow = memo(SermonRowBase);
