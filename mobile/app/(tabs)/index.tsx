import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { Image } from "expo-image";
import {
  BookOpen,
  Brain,
  ChevronRight,
  HandCoins,
  Heart,
  Play,
  Radio,
  Settings,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { Card, IconButton, ListRow, Screen, SectionHeader, Skeleton, StatusBadge, Text } from "~/components";
import { services } from "~/data/services";
import { Countdown } from "~/features/live/Countdown";
import { usePlaySermon } from "~/features/sermons/playSermon";
import { useLiveStatus } from "~/hooks/useLiveStatus";
import { useLatestDevotional } from "~/hooks/useReader";
import { useSermonList } from "~/hooks/useSermons";
import { formatLongDate, greeting } from "~/lib/dates";
import { getRecentProgress } from "~/player/recent";
import { formatProgressTime, type AudioSermon, type MediaProgress } from "~/shared";
import { radius, spacing, useTheme } from "~/theme";

const QUICK_LINKS: { label: string; icon: LucideIcon; href: Href }[] = [
  { label: "Bible Quiz", icon: Brain, href: "/quiz" },
  { label: "Fellowship", icon: Users, href: "/fellowship" },
  { label: "Give", icon: HandCoins, href: "/give" },
  { label: "Testimonies", icon: Heart, href: "/testimonies" },
];

/** Home (web landing page, re-thought for a phone: DESIGN.md §4.1). */
export default function HomeTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const latest = useSermonList({ perPage: 8 });
  const [recent, setRecent] = useState<MediaProgress[]>([]);

  // Re-read saved progress whenever Home comes back into view.
  useFocusEffect(useCallback(() => setRecent(getRecentProgress(2)), []));

  const sermons = latest.data?.pages[0]?.data ?? [];

  return (
    <Screen edges={["top", "left", "right"]} padded={false} refreshing={latest.isRefetching} onRefresh={() => latest.refetch()}>
          <View style={styles.content}>
            <View style={styles.top}>
              <Image source={require("../../assets/images/icon.png")} style={styles.logo} contentFit="contain" />
              <View style={{ flex: 1 }}>
                <Text variant="small" color="textSecondary">
                  {greeting()}
                </Text>
                <Text variant="heading">NLWC Ikorodu</Text>
              </View>
              <IconButton icon={Settings} accessibilityLabel="Settings" onPress={() => router.push("/settings")} />
            </View>

            <LiveBanner />
            <DevotionalCard />

            {recent.length ? (
              <>
                <SectionHeader label="Continue listening" />
                <Card padded={false}>
                  {recent.map((p) => (
                    <ListRow
                      key={String(p.mediaId)}
                      icon={Play}
                      title={p.title}
                      meta={`${formatProgressTime(p.currentTime)} of ${formatProgressTime(p.duration)}`}
                      progress={p.duration ? p.currentTime / p.duration : undefined}
                      onPress={() => router.push(`/sermons/${p.mediaId}`)}
                      showChevron
                    />
                  ))}
                </Card>
              </>
            ) : null}

            <SectionHeader label="Latest messages" onAction={() => router.push("/listen")} />
            <LatestCarousel sermons={sermons} loading={latest.isLoading} />

            <SectionHeader label="Get involved" />
            <View style={styles.quick}>
              {QUICK_LINKS.map((q) => (
                <Pressable
                  key={q.label}
                  accessibilityRole="button"
                  accessibilityLabel={q.label}
                  onPress={() => router.push(q.href)}
                  style={({ pressed }) => [styles.quickItem, { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.quickIcon, { backgroundColor: colors.accentSoft }]}>
                    <q.icon size={22} color={colors.primary} />
                  </View>
                  <Text variant="label" align="center" dense>
                    {q.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <SectionHeader label="Join us" title="Service times" />
            <Card padded={false}>
              {services.map((s, i) => (
                <View
                  key={s.id}
                  style={[styles.svc, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                >
                  <View style={[styles.svcIcon, { backgroundColor: colors.accentSoft }]}>
                    <s.icon size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{s.name}</Text>
                    <Text variant="small" color="textSecondary">
                      {s.day} · {s.location}
                    </Text>
                  </View>
                  <Text variant="label" color="primary">
                    {s.time}
                  </Text>
                </View>
              ))}
            </Card>

            <Card style={{ marginTop: spacing.xl }} onPress={() => router.push("/welcome")} accessibilityLabel="New here? Start here">
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color="primary">
                    New here?
                  </Text>
                  <Text variant="heading">God wants you here</Text>
                  <Text color="textSecondary">Find out what to expect and plan your first visit.</Text>
                </View>
                <ChevronRight color={colors.textMuted} />
              </View>
            </Card>
          </View>
    </Screen>
  );
}

function LiveBanner() {
  const { colors } = useTheme();
  const router = useRouter();
  const status = useLiveStatus(1000);
  if (!status.loaded) return <Skeleton height={120} rounded={radius.lg} />;

  if (status.isLive) {
    return (
      <Card onPress={() => router.push("/live")} style={{ backgroundColor: colors.live }} accessibilityLabel={`Live now: ${status.currentTitle}. Join`}>
        <View style={styles.row}>
          <Radio color="#FFFFFF" size={28} />
          <View style={{ flex: 1 }}>
            <StatusBadge label="Live now" tone="live" pulse solid />
            <Text variant="heading" style={{ color: "#FFFFFF", marginTop: 4 }}>
              {status.currentTitle || "Service in progress"}
            </Text>
            <Text style={{ color: "#FFFFFFDD" }}>Tap to watch, listen and chat</Text>
          </View>
          <ChevronRight color="#FFFFFF" />
        </View>
      </Card>
    );
  }

  if (!status.next) return null;
  return (
    <Card onPress={() => router.push("/live")} accessibilityLabel={`Next service: ${status.next.label}`}>
      <Text variant="caption" color="primary">
        Next service
      </Text>
      <Text variant="heading">{status.next.label}</Text>
      <Text variant="small" color="textSecondary" style={{ marginBottom: spacing.sm }}>
        {status.next.formattedDate}
      </Text>
      <Countdown seconds={status.secondsToNext} compact />
    </Card>
  );
}

function DevotionalCard() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data } = useLatestDevotional();
  if (!data) return null;
  return (
    <Card
      style={{ marginTop: spacing.md, backgroundColor: colors.accentSoft }}
      onPress={() => router.push(`/devotionals/${data.id}`)}
      accessibilityLabel={`Today's devotional: ${data.title}`}
    >
      <View style={styles.row}>
        <Sun color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="primary">
            Daily devotional · {formatLongDate(data.scheduledDate)}
          </Text>
          <Text variant="bodyStrong" numberOfLines={2}>
            {data.title}
          </Text>
        </View>
        <ChevronRight color={colors.textMuted} />
      </View>
    </Card>
  );
}

function LatestCarousel({ sermons, loading }: { sermons: AudioSermon[]; loading: boolean }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { playSermon } = usePlaySermon();

  if (loading) {
    return (
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Skeleton width={220} height={190} rounded={radius.lg} />
        <Skeleton width={220} height={190} rounded={radius.lg} />
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={sermons}
      keyExtractor={(s) => String(s.id)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm }}
      style={{ marginHorizontal: -spacing.gutter }}
      ListHeaderComponent={<View style={{ width: spacing.gutter - spacing.sm }} />}
      ListFooterComponent={<View style={{ width: spacing.gutter - spacing.sm }} />}
      renderItem={({ item }) => (
        <Card padded={false} style={styles.slide} onPress={() => router.push(`/sermons/${item.id}`)} accessibilityLabel={`${item.title} by ${item.speaker}`}>
          <View>
            {item.thumbnailUrl ? (
              <Image source={{ uri: item.thumbnailUrl }} style={styles.slideImg} contentFit="cover" />
            ) : (
              <View style={[styles.slideImg, { backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }]}>
                <BookOpen color={colors.primary} />
              </View>
            )}
            <IconButton
              icon={Play}
              filled
              size={16}
              accessibilityLabel={`Play ${item.title}`}
              onPress={() => playSermon(item)}
              style={styles.slidePlay}
            />
          </View>
          <View style={{ padding: spacing.sm }}>
            <Text variant="label" numberOfLines={2}>
              {item.title}
            </Text>
            <Text variant="small" color="textSecondary" numberOfLines={1}>
              {item.speaker}
            </Text>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.gutter, paddingBottom: spacing.huge * 2 },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  logo: { width: 44, height: 44, borderRadius: 22 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  quick: { flexDirection: "row", gap: spacing.xs },
  quickItem: { flex: 1, alignItems: "center", gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.lg },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  svc: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  svcIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  slide: { width: 220 },
  slideImg: { width: 220, height: 124 },
  slidePlay: { position: "absolute", right: 8, bottom: 8, width: 44, height: 44 },
});
