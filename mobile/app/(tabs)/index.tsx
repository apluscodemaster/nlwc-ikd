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
} from "~/components/icons";
import { Card, IconButton, ListRow, Screen, SectionHeader, Skeleton, StatusBadge, Text } from "~/components";
import { dayName, formatHour } from "~/api/schedule";
import { annualMeetings, serviceIcon } from "~/data/services";
import { Countdown } from "~/features/live/Countdown";
import { usePlaySermon } from "~/features/sermons/playSermon";
import { useLiveStatus, useSchedule } from "~/hooks/useLiveStatus";
import { useGallery } from "~/hooks/useGallery";
import { useLatestDevotional } from "~/hooks/useReader";
import { useSermonList } from "~/hooks/useSermons";
import { formatCompactDate, formatLongDate, greeting } from "~/lib/dates";
import { getRecentProgress } from "~/player/recent";
import { formatProgressTime, sizedGoogleImage, type AudioSermon, type MediaProgress } from "~/shared";
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
  const { colors, scheme } = useTheme();
  const latest = useSermonList({ perPage: 8 });
  const [recent, setRecent] = useState<MediaProgress[]>([]);

  // Re-read saved progress whenever Home comes back into view.
  useFocusEffect(useCallback(() => setRecent(getRecentProgress(2)), []));

  const sermons = latest.data?.pages[0]?.data ?? [];

  return (
    <Screen edges={["top", "left", "right"]} padded={false} refreshing={latest.isRefetching} onRefresh={() => void latest.refetch()}>
          <View style={styles.content}>
            <View style={styles.top}>
              {/* Emblem only, on a white badge so its dark artwork reads in dark mode too. */}
              <View style={[styles.logoBadge, scheme === "light" && styles.logoBadgeLift]}>
                <Image
                  source={require("../../assets/images/emblem.png")}
                  style={styles.logo}
                  contentFit="contain"
                  accessibilityLabel="The New & Living Way Church emblem"
                />
              </View>
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
                    <q.icon size={20} color={colors.primary} />
                  </View>
                  <Text variant="label" align="center" dense>
                    {q.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ServiceTimes />

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

            <GalleryStrip />
          </View>
    </Screen>
  );
}

/** "Church Auditorium, Ikorodu" → "Church Auditorium" (the app is Ikorodu-only). */
function shortLocation(location?: string): string {
  return (location ?? "").replace(/,\s*Ikorodu\s*$/i, "").trim();
}

/** One row in the service-times card. */
function ScheduleRow({
  icon: Icon,
  title,
  subtitle,
  trailing,
  first,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  trailing: string;
  first: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.svc, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
      accessible
      accessibilityLabel={`${title}, ${subtitle}, ${trailing}`}
    >
      <View style={[styles.svcIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="small" color="textSecondary">
          {subtitle}
        </Text>
      </View>
      <Text variant="label" color="primary">
        {trailing}
      </Text>
    </View>
  );
}

/**
 * Weekly services from the admin schedule (Admin → Settings → Schedule), so
 * changes there appear here automatically, followed by the annual meetings.
 */
function ServiceTimes() {
  const schedule = useSchedule();
  const weekly = (schedule.data?.recurring ?? [])
    .filter((s) => s.active !== false)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour);

  return (
    <>
      <SectionHeader label="Join us" title="Service times" />
      {schedule.isLoading && !weekly.length ? (
        <Skeleton height={190} rounded={radius.lg} />
      ) : weekly.length ? (
        <Card padded={false}>
          {weekly.map((s, i) => (
            <ScheduleRow
              key={s.id ?? `${s.dayOfWeek}-${s.startHour}`}
              first={i === 0}
              icon={serviceIcon(s)}
              title={s.label}
              subtitle={[s.recurrenceLabel || `Every ${dayName(s.dayOfWeek)}`, shortLocation(s.location)]
                .filter(Boolean)
                .join(" · ")}
              trailing={formatHour(s.startHour)}
            />
          ))}
        </Card>
      ) : (
        <Text color="textSecondary">Service times will appear here soon.</Text>
      )}
      <Text variant="small" color="textMuted" style={{ marginTop: spacing.xs }}>
        Times are Lagos time (WAT).
      </Text>

      <SectionHeader label="Every year" title="Annual meetings" />
      <Card padded={false}>
        {annualMeetings.map((m, i) => (
          <ScheduleRow key={m.id} first={i === 0} icon={m.icon} title={m.name} subtitle={m.period} trailing={m.short} />
        ))}
      </Card>
    </>
  );
}

const GALLERY_PREVIEW = 10;

/** Photos from the most recent event in the gallery sheet (web GalleryPreview). */
function GalleryStrip() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading } = useGallery();
  // The sheet is sorted oldest-first, so the last entry is the latest event.
  const latest = data?.length ? data[data.length - 1] : undefined;
  const photos = (latest?.images ?? []).filter(Boolean).slice(0, GALLERY_PREVIEW);

  if (!isLoading && !photos.length) return null;
  const label = latest ? `Gallery · ${formatCompactDate(latest.date)}` : "Gallery";

  return (
    <>
      <SectionHeader
        label={label}
        title="Recent moments"
        onAction={latest ? () => router.push({ pathname: "/gallery", params: { date: latest.date } }) : undefined}
      />
      {isLoading ? (
        <View style={styles.galleryRow}>
          <Skeleton width={150} height={150} rounded={radius.lg} />
          <Skeleton width={150} height={150} rounded={radius.lg} />
        </View>
      ) : (
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(u, i) => `${i}-${u}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs }}
          style={{ marginHorizontal: -spacing.gutter }}
          ListHeaderComponent={<View style={{ width: spacing.gutter - spacing.xs }} />}
          ListFooterComponent={<View style={{ width: spacing.gutter - spacing.xs }} />}
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel={`Gallery photo ${index + 1} of ${photos.length}`}
              onPress={() =>
                router.push({ pathname: "/gallery", params: { date: latest!.date, photo: String(index) } })
              }
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Image
                source={{ uri: sizedGoogleImage(item, 400) }}
                style={[styles.galleryPhoto, { backgroundColor: colors.surfaceMuted }]}
                contentFit="cover"
                transition={150}
                recyclingKey={item}
              />
            </Pressable>
          )}
        />
      )}
    </>
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
  content: { padding: spacing.gutter, paddingBottom: spacing.xs },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  galleryRow: { flexDirection: "row", gap: spacing.xs },
  galleryPhoto: { width: 150, height: 150, borderRadius: radius.lg },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  // Light mode only: white-on-near-white needs a soft lift (a hairline border
  // rendered black on Android); in dark mode the white badge already stands out.
  logoBadgeLift: {
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logo: { width: 30, height: 36 },
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
