import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown, FileText, Pause, Play, Radio, RotateCcw, RotateCw } from "~/components/icons";
import { Button, Chip, IconButton, StatusBadge, Text } from "~/components";
import { usePlayer, usePlayerStatus } from "~/player/PlayerProvider";
import { Scrubber } from "~/player/Scrubber";
import { PLAYBACK_RATES } from "~/player/types";
import { radius, spacing, useTheme } from "~/theme";

/** Full-screen player (port of the web MobileFullPlayer), presented as a modal. */
export default function PlayerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { track, toggle, seekBy, seekTo, setRate } = usePlayer();
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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton icon={ChevronDown} accessibilityLabel="Minimise player" onPress={() => router.back()} />
        <Text variant="caption" color="textSecondary">
          {track.isLive ? "Live broadcast" : "Now playing"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

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
        {track.isLive ? <StatusBadge label="Live" tone="live" pulse /> : null}
        <Text variant="title" numberOfLines={3}>
          {track.title}
        </Text>
        {track.artist ? <Text color="textSecondary">{track.artist}</Text> : null}
      </View>

      {!track.isLive ? <Scrubber position={position} duration={duration} onSeek={seekTo} /> : null}

      <View style={styles.controls}>
        {!track.isLive ? (
          <IconButton icon={RotateCcw} accessibilityLabel="Back 15 seconds" onPress={() => seekBy(-15)} size={28} />
        ) : null}
        <IconButton
          icon={playing ? Pause : Play}
          accessibilityLabel={playing ? "Pause" : buffering ? "Loading" : "Play"}
          onPress={toggle}
          filled
          size={34}
          style={styles.playBtn}
        />
        {!track.isLive ? (
          <IconButton icon={RotateCw} accessibilityLabel="Forward 15 seconds" onPress={() => seekBy(15)} size={28} />
        ) : null}
      </View>

      {!track.isLive ? (
        <View style={styles.rates} accessibilityLabel="Playback speed">
          {PLAYBACK_RATES.map((r) => (
            <Chip key={r} label={`${r}×`} selected={rate === r} onPress={() => setRate(r)} />
          ))}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  artWrap: { alignItems: "center", marginTop: spacing.lg },
  art: { width: "86%", aspectRatio: 1, borderRadius: radius.xl },
  artFallback: { alignItems: "center", justifyContent: "center" },
  meta: { marginTop: spacing.xl, marginBottom: spacing.md, gap: spacing.xxs },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
    marginTop: spacing.md,
  },
  playBtn: { width: 76, height: 76 },
  rates: { flexDirection: "row", justifyContent: "center", gap: spacing.xs, marginTop: spacing.xl },
  link: { alignSelf: "center", marginTop: spacing.md },
});
