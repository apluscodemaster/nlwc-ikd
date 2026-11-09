import { Share, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Share2 } from "~/components/icons";
import { Button, EmptyState, ErrorState, LoadingState, Screen, Text } from "~/components";
import { YouTubePlayer } from "~/features/video/YouTubePlayer";
import { useVideoMessages } from "~/hooks/useVideo";
import { SITE_URL } from "~/lib/config";
import { findVideoBySlug, videoSlug } from "~/shared";
import { spacing } from "~/theme";

export default function VideoMessageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useVideoMessages();
  const video = query.data ? findVideoBySlug(query.data, decodeURIComponent(slug ?? "")) : undefined;

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!video) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Video" }} />
        <EmptyState title="Video not found" message="This video may have been removed." />
      </Screen>
    );
  }

  const share = () =>
    Share.share({
      message: `${video.title ?? "Video message"} — ${SITE_URL}/video-messages/${videoSlug(video)}`,
    });

  return (
    <Screen>
      <Stack.Screen options={{ title: "Video message" }} />
      <YouTubePlayer videoId={video.id} inset={16} autoplay />
      <View style={styles.meta}>
        {video.serviceCategory ? (
          <Text variant="caption" color="primary">
            {video.serviceCategory}
          </Text>
        ) : null}
        <Text variant="title">{video.title || "Untitled message"}</Text>
        <Text color="textSecondary">{[video.minister, video.date].filter(Boolean).join(" · ")}</Text>
      </View>
      <Button title="Share" variant="secondary" icon={Share2} onPress={share} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { marginTop: spacing.lg, marginBottom: spacing.lg, gap: spacing.xxs },
});
