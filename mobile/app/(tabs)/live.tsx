import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { CalendarClock, Headphones, Video } from "lucide-react-native";
import { dayName, formatHour } from "~/api/schedule";
import { Card, EmptyState, LoadingState, SectionHeader, SegmentedControl, StatusBadge, Text } from "~/components";
import { Countdown } from "~/features/live/Countdown";
import { LiveChat } from "~/features/live/LiveChat";
import { YouTubePlayer } from "~/features/video/YouTubePlayer";
import { useLiveStatus, useSchedule } from "~/hooks/useLiveStatus";
import { useVideoStream } from "~/hooks/useVideo";
import { spacing, useTheme } from "~/theme";

/** Waystream audio broadcast (same embed as the website's /listen-live). */
const WAYSTREAM_EMBED_URL = "https://app.waystream.io/embed/nlwcikorodu?orientation=portrait";

type Mode = "video" | "audio";

/** Live tab (web /live + /listen-live). Countdown off-air; stream + chat when live. */
export default function LiveTab() {
  const { colors } = useTheme();
  const status = useLiveStatus(1000);
  const [mode, setMode] = useState<Mode>("video");

  if (!status.loaded) return <LoadingState label="Loading the service schedule…" />;

  if (!status.isLive) return <OffAir status={status} />;

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <View style={styles.liveHead}>
          <View style={styles.row}>
            <StatusBadge label="Live now" tone="live" pulse solid />
            <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>
              {status.currentTitle || "Service"}
            </Text>
          </View>
          <SegmentedControl
            segments={[
              { value: "video", label: "Watch" },
              { value: "audio", label: "Listen (saves data)" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </View>
        {mode === "video" ? <LiveVideo /> : <LiveAudio />}
        <LiveChat />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LiveVideo() {
  const stream = useVideoStream(true);
  if (stream.isLoading) return <View style={{ height: 220 }} />;
  if (!stream.data) {
    return (
      <View style={styles.pad}>
        <EmptyState icon={Video} title="Video starting soon" message="The video stream isn't up yet. Try Listen meanwhile." />
      </View>
    );
  }
  return (
    <View style={styles.pad}>
      <YouTubePlayer videoId={stream.data.videoId} embedUrl={stream.data.embedUrl} inset={spacing.gutter} autoplay />
    </View>
  );
}

function LiveAudio() {
  const { colors } = useTheme();
  return (
    <View style={[styles.audio, { borderColor: colors.border }]}>
      <WebView
        source={{ uri: WAYSTREAM_EMBED_URL }}
        style={{ flex: 1, backgroundColor: "transparent" }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        accessibilityLabel="Live audio broadcast player"
      />
    </View>
  );
}

function OffAir({ status }: { status: ReturnType<typeof useLiveStatus> }) {
  const { colors } = useTheme();
  const schedule = useSchedule();
  const services = (schedule.data?.recurring ?? [])
    .filter((s) => s.active !== false)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour);

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.offAir}>
        {status.next ? (
          <>
            <Text variant="caption" color="primary">
              Next service
            </Text>
            <Text variant="title">{status.next.label}</Text>
            <Text color="textSecondary" style={{ marginBottom: spacing.md }}>
              {status.next.formattedDate}
            </Text>
            <Countdown seconds={status.secondsToNext} />
            <Card style={{ marginTop: spacing.lg }}>
              <View style={styles.row}>
                <Headphones size={18} color={colors.primary} />
                <Text variant="label" style={{ flex: 1 }}>
                  The stream, audio broadcast and live chat open here automatically when the service starts.
                </Text>
              </View>
            </Card>
          </>
        ) : (
          <EmptyState icon={CalendarClock} title="No upcoming services" message="Check back soon for the service schedule." />
        )}

        {services.length ? (
          <>
            <SectionHeader label="Every week" title="Service times" />
            <Card padded={false}>
              {services.map((s, i) => (
                <View
                  key={s.id ?? `${s.dayOfWeek}-${s.startHour}`}
                  style={[styles.svc, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{s.label}</Text>
                    <Text variant="small" color="textSecondary">
                      {dayName(s.dayOfWeek)}
                    </Text>
                  </View>
                  <Text variant="label" color="primary">
                    {formatHour(s.startHour)}
                  </Text>
                </View>
              ))}
            </Card>
            <Text variant="small" color="textMuted" style={{ marginTop: spacing.xs }}>
              Times are Lagos time (WAT).
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  liveHead: { padding: spacing.gutter, gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pad: { paddingHorizontal: spacing.gutter },
  audio: { height: 220, marginHorizontal: spacing.gutter, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, overflow: "hidden" },
  offAir: { padding: spacing.gutter, paddingBottom: spacing.huge * 2 },
  svc: { flexDirection: "row", alignItems: "center", padding: spacing.md },
});
