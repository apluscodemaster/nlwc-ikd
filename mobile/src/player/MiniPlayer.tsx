import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pause, Play, Radio, X } from "~/components/icons";
import { IconButton, Text } from "~/components";
import { radius, spacing, useTheme } from "~/theme";
import { usePlayer, usePlayerStatus } from "./PlayerProvider";

/** 56pt bar docked above the tab bar while something is loaded (DESIGN.md §4.4). */
export function MiniPlayer() {
  const { track, toggle, stop } = usePlayer();
  const { playing, position, duration } = usePlayerStatus();
  const { colors } = useTheme();
  const router = useRouter();

  if (!track) return null;
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Pressable
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={`Now playing: ${track.title}. Open player`}
        onPress={() => router.push("/player")}
      >
        {track.artwork ? (
          <Image source={{ uri: track.artwork }} style={styles.art} contentFit="cover" />
        ) : (
          <View style={[styles.art, styles.artFallback, { backgroundColor: colors.accentSoft }]}>
            <Radio size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.text}>
          <Text variant="label" numberOfLines={1} dense>
            {track.title}
          </Text>
          <Text variant="small" color="textSecondary" numberOfLines={1} dense>
            {track.isLive ? "Live broadcast" : (track.artist ?? "NLWC Ikorodu")}
          </Text>
        </View>
      </Pressable>
      <IconButton
        icon={playing ? Pause : Play}
        accessibilityLabel={playing ? `Pause ${track.title}` : `Play ${track.title}`}
        onPress={toggle}
        color="primary"
      />
      <IconButton icon={X} accessibilityLabel="Close player" onPress={stop} color="textMuted" size={18} />
      {!track.isLive ? (
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.sm,
    paddingRight: spacing.xxs,
    height: 60,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  art: { width: 40, height: 40, borderRadius: radius.sm },
  artFallback: { alignItems: "center", justifyContent: "center" },
  text: { flex: 1 },
  track: { position: "absolute", left: 0, right: 0, top: 0, height: 2 },
  fill: { height: 2 },
});
