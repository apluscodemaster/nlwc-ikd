import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { WebView } from "react-native-webview";
import { ExternalLink, Share2, Sun } from "~/components/icons";
import { Button, EmptyState, ErrorState, LoadingState, Text } from "~/components";
import { useDevotional } from "~/hooks/useReader";
import { SITE_URL } from "~/lib/config";
import { formatLongDate } from "~/lib/dates";
import { spacing, useTheme } from "~/theme";

/** Devotional (a PDF): shown inline via the Google Docs viewer, as the website does. */
export default function DevotionalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const query = useDevotional(id);
  const [viewerFailed, setViewerFailed] = useState(false);
  const d = query.data;

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!d) return <EmptyState icon={Sun} title="Devotional not found" message="It may not be released yet." />;

  const viewer = d.pdfUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(d.pdfUrl)}&embedded=true`
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Devotional" }} />
      <View style={[styles.head, { borderBottomColor: colors.border }]}>
        <Text variant="caption" color="primary">
          {formatLongDate(d.scheduledDate)}
        </Text>
        <Text variant="heading">{d.title}</Text>
        <View style={styles.actions}>
          {d.pdfUrl ? (
            <Button
              title="Open PDF"
              size="sm"
              variant="secondary"
              icon={ExternalLink}
              onPress={() => WebBrowser.openBrowserAsync(d.pdfUrl!).catch(() => {})}
            />
          ) : null}
          <Button
            title="Share"
            size="sm"
            variant="secondary"
            icon={Share2}
            onPress={() => Share.share({ message: `${d.title}\n${SITE_URL}/devotionals/${d.id}` })}
          />
        </View>
      </View>
      {viewer && !viewerFailed ? (
        <WebView
          source={{ uri: viewer }}
          style={{ flex: 1, backgroundColor: colors.background }}
          startInLoadingState
          renderLoading={() => <LoadingState label="Opening devotional…" />}
          onError={() => setViewerFailed(true)}
          setSupportMultipleWindows={false}
        />
      ) : (
        <EmptyState
          icon={Sun}
          title="Open the devotional"
          message="This devotional opens as a PDF."
          actionLabel={d.pdfUrl ? "Open PDF" : undefined}
          onAction={() => d.pdfUrl && WebBrowser.openBrowserAsync(d.pdfUrl).catch(() => {})}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { padding: spacing.gutter, gap: spacing.xxs, borderBottomWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
});
