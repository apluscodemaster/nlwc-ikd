import { useMemo } from "react";
import { Share, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ChevronLeft, ChevronRight, FileText, Headphones, Pause, Play, Share2 } from "~/components/icons";
import { Button, Card, ErrorState, LoadingState, Screen, StatusBadge, Text } from "~/components";
import { usePlaySermon } from "~/features/sermons/playSermon";
import { useSermonDetail, useSermonList, useTranscriptForSermon } from "~/hooks/useSermons";
import { SITE_URL } from "~/lib/config";
import { usePlayer, usePlayerStatus } from "~/player/PlayerProvider";
import {
  findAdjacentParts,
  formatProgressTime,
  getMediaProgress,
  parseSermonPart,
  type AudioSermon,
} from "~/shared";
import { radius, spacing, useTheme } from "~/theme";

/** Audio message detail (web /sermons/audio/[id]). */
export default function SermonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sermonId = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const query = useSermonDetail(Number.isFinite(sermonId) ? sermonId : undefined);
  const sermon = query.data;

  const { track, toggle } = usePlayer();
  const { playing } = usePlayerStatus();
  const { playSermon, loadingId } = usePlaySermon();
  const transcriptSlug = useTranscriptForSermon(sermon);

  // Sibling parts ("… Part 2") for previous/next navigation.
  const part = sermon ? parseSermonPart(sermon.title) : null;
  const siblings = useSermonList({ search: part?.baseTitle, perPage: 30 }, { enabled: !!part });
  const adjacent = useMemo(() => {
    if (!sermon || !part) return { previous: null, next: null };
    const all = siblings.data?.pages.flatMap((p) => p.data) ?? [];
    return findAdjacentParts<AudioSermon>(sermon.title, all);
  }, [sermon, part, siblings.data]);

  // Multi-part messages play on into the next part; other messages keep
  // whatever queue they were in (undefined leaves it unchanged).
  const partQueue = useMemo(() => {
    if (!sermon || !(adjacent.previous || adjacent.next)) return undefined;
    return [adjacent.previous, sermon, adjacent.next].filter((s): s is AudioSermon => !!s);
  }, [sermon, adjacent]);

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !sermon) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const isCurrent = track?.id === sermon.id;
  const saved = getMediaProgress(sermon.id);
  const playLabel = isCurrent ? (playing ? "Pause" : "Play") : saved ? `Resume from ${formatProgressTime(saved.currentTime)}` : "Play message";

  const share = () =>
    Share.share({ message: `${sermon.title} — ${sermon.speaker}\n${SITE_URL}/sermons/audio/${sermon.id}` });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Message" }} />
      {sermon.thumbnailUrl ? (
        <Image source={{ uri: sermon.thumbnailUrl }} style={styles.art} contentFit="cover" />
      ) : (
        <View style={[styles.art, styles.artFallback, { backgroundColor: colors.accentSoft }]}>
          <Headphones size={64} color={colors.primary} />
        </View>
      )}

      <View style={styles.meta}>
        {sermon.series ? (
          <Text variant="caption" color="primary">
            {sermon.series}
          </Text>
        ) : null}
        <Text variant="title" accessibilityRole="header">
          {sermon.title}
        </Text>
        <Text color="textSecondary">{[sermon.speaker, sermon.date, sermon.duration].filter(Boolean).join(" · ")}</Text>
        {part ? <StatusBadge label={`Part ${part.part}`} /> : null}
      </View>

      <Button
        title={playLabel}
        icon={isCurrent && playing ? Pause : Play}
        size="lg"
        fullWidth
        loading={loadingId === sermon.id}
        onPress={() => (isCurrent ? toggle() : void playSermon(sermon, partQueue))}
      />

      <View style={styles.actions}>
        {transcriptSlug ? (
          <Button
            title="Read transcript"
            variant="secondary"
            icon={FileText}
            onPress={() => router.push(`/transcripts/${transcriptSlug}`)}
          />
        ) : null}
        <Button title="Share" variant="secondary" icon={Share2} onPress={share} />
      </View>

      {sermon.description ? (
        <Card style={styles.card}>
          <Text variant="caption" color="textSecondary">
            About this message
          </Text>
          <Text style={{ marginTop: spacing.xs }}>{sermon.description}</Text>
        </Card>
      ) : null}

      {adjacent.previous || adjacent.next ? (
        <View style={styles.parts}>
          {adjacent.previous ? (
            <PartLink direction="prev" sermon={adjacent.previous} onPress={() => router.replace(`/sermons/${adjacent.previous!.id}`)} />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {adjacent.next ? (
            <PartLink direction="next" sermon={adjacent.next} onPress={() => router.replace(`/sermons/${adjacent.next!.id}`)} />
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function PartLink({ direction, sermon, onPress }: { direction: "prev" | "next"; sermon: AudioSermon; onPress: () => void }) {
  const { colors } = useTheme();
  const p = parseSermonPart(sermon.title);
  return (
    <Card onPress={onPress} style={{ flex: 1 }} accessibilityLabel={`${direction === "prev" ? "Previous" : "Next"} part: ${sermon.title}`}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, justifyContent: direction === "next" ? "flex-end" : "flex-start" }}>
        {direction === "prev" ? <ChevronLeft size={16} color={colors.primary} /> : null}
        <Text variant="caption" color="primary">
          {direction === "prev" ? "Previous" : "Next"} · Part {p?.part}
        </Text>
        {direction === "next" ? <ChevronRight size={16} color={colors.primary} /> : null}
      </View>
      <Text variant="label" numberOfLines={2} align={direction === "next" ? "right" : "left"} style={{ marginTop: 4 }}>
        {sermon.title}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  art: { width: "100%", aspectRatio: 16 / 10, borderRadius: radius.xl },
  artFallback: { alignItems: "center", justifyContent: "center" },
  meta: { marginTop: spacing.lg, marginBottom: spacing.lg, gap: spacing.xxs },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  card: { marginTop: spacing.lg },
  parts: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
});
