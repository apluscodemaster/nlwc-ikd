import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronDown,
  FileText,
  ListMusic,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
} from "~/components/icons";
import { Button, Chip, IconButton, StatusBadge, Text } from "~/components";
import { usePlayer, usePlayerStatus } from "~/player/PlayerProvider";
import { Scrubber } from "~/player/Scrubber";
import { PLAYBACK_RATES } from "~/player/types";
import { radius, spacing, useTheme } from "~/theme";

/** Full-screen player (port of the web MobileFullPlayer), presented as a modal. */
export default function PlayerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { track, upNext, canSkip, repeat, shuffle, toggle, seekBy, seekTo, setRate, next, previous, toggleRepeat, toggleShuffle } =
    usePlayer();
  const { playing, position, duration, rate, buffering } = usePlayerStatus();

  if (!track) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <IconButton icon={ChevronDown} accessibilityLabel="Close" onPress={() => router.back()} />
        <Text align="center" color="textSecondary">
          Nothing is playing.
        </Text>
      </SafeAreaView>
    );
  }

  const live = !!track.isLive;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon={ChevronDown} accessibilityLabel="Minimise player" onPress={() => router.back()} />
        <Text variant="caption" color="textSecondary">
          {live ? "Live broadcast" : "Now playing"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.artWrap}>
          {track.artwork ? (
            <Image source={{ uri: track.artwork }} style={styles.art} contentFit="cover" />
          ) : (
            <View style={[styles.art, styles.artFallback, { backgroundColor: colors.accentSoft }]}>
              <Radio size={72} color={colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.meta}>
          {live ? <StatusBadge label="Live" tone="live" pulse /> : null}
          <Text variant="title" numberOfLines={3}>
            {track.title}
          </Text>
          {track.artist ? <Text color="textSecondary">{track.artist}</Text> : null}
        </View>

        {!live ? <Scrubber position={position} duration={duration} onSeek={seekTo} /> : null}

        <View style={styles.controls}>
          {!live ? (
            <>
              <IconButton icon={SkipBack} accessibilityLabel="Previous message, or restart" onPress={previous} size={24} />
              <IconButton icon={RotateCcw} accessibilityLabel="Back 15 seconds" onPress={() => seekBy(-15)} size={26} />
            </>
          ) : null}
          <IconButton
            icon={playing ? Pause : Play}
            accessibilityLabel={playing ? "Pause" : buffering ? "Loading" : "Play"}
            onPress={toggle}
            filled
            size={32}
            style={styles.playBtn}
          />
          {!live ? (
            <>
              <IconButton icon={RotateCw} accessibilityLabel="Forward 15 seconds" onPress={() => seekBy(15)} size={26} />
              <IconButton
                icon={SkipForward}
                accessibilityLabel="Next message"
                onPress={next}
                disabled={!canSkip}
                size={24}
                style={!canSkip && styles.dim}
              />
            </>
          ) : null}
        </View>

        {!live ? (
          <View style={styles.modes}>
            <IconButton
              icon={Shuffle}
              accessibilityLabel={shuffle ? "Turn shuffle off" : "Turn shuffle on"}
              accessibilityState={{ selected: shuffle }}
              onPress={toggleShuffle}
              size={20}
              color={shuffle ? "primary" : "textMuted"}
              style={shuffle && { backgroundColor: colors.accentSoft }}
            />
            <View style={styles.rates} accessibilityLabel="Playback speed">
              {PLAYBACK_RATES.map((r) => (
                <Chip key={r} label={`${r}×`} selected={rate === r} onPress={() => setRate(r)} />
              ))}
            </View>
            <IconButton
              icon={repeat ? Repeat1 : Repeat}
              accessibilityLabel={repeat ? "Turn repeat off" : "Repeat this message"}
              accessibilityState={{ selected: repeat }}
              onPress={toggleRepeat}
              size={20}
              color={repeat ? "primary" : "textMuted"}
              style={repeat && { backgroundColor: colors.accentSoft }}
            />
          </View>
        ) : null}

        {!live ? (
          <View style={[styles.upNext, { borderColor: colors.border }]}>
            <ListMusic size={18} color={colors.textMuted} />
            <Text variant="small" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
              {repeat
                ? "Repeat is on: this message will play again."
                : shuffle && canSkip
                  ? "Shuffle is on: a random message from the list plays next."
                  : upNext
                    ? `Up next: ${upNext.title}`
                    : "Playback stops when this message ends."}
            </Text>
          </View>
        ) : null}

        {track.href ? (
          <Button
            title="View message"
            variant="ghost"
            icon={FileText}
            style={styles.link}
            onPress={() => {
              router.back();
              router.push(track.href as never);
            }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  body: { paddingBottom: spacing.xl },
  artWrap: { alignItems: "center", marginTop: spacing.md },
  art: { width: "80%", aspectRatio: 1, borderRadius: radius.xl },
  artFallback: { alignItems: "center", justifyContent: "center" },
  meta: { marginTop: spacing.lg, marginBottom: spacing.md, gap: spacing.xxs },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  playBtn: { width: 72, height: 72 },
  dim: { opacity: 0.35 },
  modes: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.lg },
  rates: { flexDirection: "row", justifyContent: "center", gap: spacing.xxs },
  upNext: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  link: { alignSelf: "center", marginTop: spacing.sm },
});
