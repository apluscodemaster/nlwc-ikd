import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Download, Headphones, Pause, Play, Trash2 } from "~/components/icons";
import { EmptyState, IconButton, Text } from "~/components";
import {
  downloadsSize,
  formatBytes,
  removeDownload,
  useDownloads,
  type DownloadedSermon,
} from "~/features/downloads/downloads";
import { usePlayer, usePlayerStatus } from "~/player/PlayerProvider";
import type { Track } from "~/player/types";
import { radius, spacing, useTheme } from "~/theme";

function toTrack(d: DownloadedSermon): Track {
  const numeric = Number(d.id);
  return {
    // Sermon ids are numbers elsewhere (saved progress is keyed by them).
    id: Number.isFinite(numeric) ? numeric : d.id,
    title: d.title,
    artist: d.artist,
    album: d.album,
    artwork: d.artwork,
    url: d.uri,
    href: d.href,
  };
}

/** Messages saved for offline listening. */
export default function DownloadsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { items } = useDownloads();
  const { track, play, toggle } = usePlayer();
  const { playing } = usePlayerStatus();

  const queue = items.map(toTrack);

  const confirmRemove = (d: DownloadedSermon) =>
    Alert.alert("Remove download?", `"${d.title}" will need data to play again.`, [
      { text: "Keep", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeDownload(d.id) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Downloads" }} />
      <FlatList
        data={items}
        keyExtractor={(d) => d.id}
        contentContainerStyle={items.length ? styles.list : styles.emptyList}
        ListHeaderComponent={
          items.length ? (
            <Text variant="small" color="textSecondary" style={{ marginBottom: spacing.sm }}>
              {items.length} message{items.length === 1 ? "" : "s"} · {formatBytes(downloadsSize(items))} on this phone.
              They play without data.
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon={Download}
            title="No downloads yet"
            message="Tap Download on a message to listen to it without data."
            actionLabel="Browse messages"
            onAction={() => router.navigate("/listen")}
          />
        }
        renderItem={({ item, index }) => {
          const t = queue[index];
          const current = !!track && String(track.id) === item.id;
          const PlayIcon = current && playing ? Pause : Play;
          return (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Pressable
                style={styles.main}
                onPress={() => (current ? toggle() : play(t, { queue }))}
                accessibilityRole="button"
                accessibilityLabel={`${current && playing ? "Pause" : "Play"} ${item.title}`}
              >
                {item.artwork ? (
                  <Image source={{ uri: item.artwork }} style={styles.art} contentFit="cover" />
                ) : (
                  <View style={[styles.art, styles.artFallback, { backgroundColor: colors.accentSoft }]}>
                    <Headphones size={20} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text variant="label" numberOfLines={2} color={current ? "primary" : "text"}>
                    {item.title}
                  </Text>
                  <Text variant="small" color="textSecondary" numberOfLines={1}>
                    {[item.artist, formatBytes(item.size)].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <PlayIcon size={20} color={colors.primary} />
              </Pressable>
              <IconButton
                icon={Trash2}
                accessibilityLabel={`Remove ${item.title}`}
                onPress={() => confirmRemove(item)}
              />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.gutter, gap: spacing.xs },
  emptyList: { flexGrow: 1, padding: spacing.gutter },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingRight: spacing.xxs,
  },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm },
  art: { width: 48, height: 48, borderRadius: radius.md },
  artFallback: { alignItems: "center", justifyContent: "center" },
});
