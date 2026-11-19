import { useState, type ReactNode } from "react";
import { ScrollView, Share, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Minus, Plus, Share2, Type } from "~/components/icons";
import { Card, Chip, IconButton, Sheet, StatusBadge, Text } from "~/components";
import { radius, spacing, useTheme } from "~/theme";
import { HtmlContent } from "./HtmlContent";
import { FONT_MAX, FONT_MIN, useReaderPrefs } from "./readerPrefs";
import { ScriptureSheet } from "./ScriptureSheet";

export interface ReaderLink {
  title: string;
  onPress: () => void;
}

interface Props {
  screenTitle: string;
  overline?: string;
  title: string;
  meta?: string;
  badge?: string;
  html: string;
  query?: string;
  shareText: string;
  previous?: ReaderLink | null;
  next?: ReaderLink | null;
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared layout for transcripts and manuals: reading-progress bar, text size
 * and background controls, scripture sheet, share, previous/next.
 */
export function ReaderLayout({
  screenTitle,
  overline,
  title,
  meta,
  badge,
  html,
  query,
  shareText,
  previous,
  next,
  header,
  footer,
}: Props) {
  const { colors } = useTheme();
  const { fontSize, surface, setFontSize, setSurface } = useReaderPrefs();
  const [progress, setProgress] = useState(0);
  const [reference, setReference] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const bg = surface === "sepia" ? colors.sepia : colors.background;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.height - layoutMeasurement.height;
    setProgress(max > 0 ? Math.min(1, Math.max(0, contentOffset.y / max)) : 0);
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: bg }}>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <IconButton
                icon={Type}
                accessibilityLabel="Text size"
                onPress={() => setShowPrefs(true)}
                color="primary"
              />
              <IconButton
                icon={Share2}
                accessibilityLabel="Share"
                onPress={() => Share.share({ message: shareText })}
                color="primary"
              />
            </View>
          ),
        }}
      />
      <View
        style={[styles.progress, { backgroundColor: colors.primary, width: `${progress * 100}%` }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <ScrollView onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={styles.content}>
        {header}
        {overline ? (
          <Text variant="caption" color="primary">
            {overline}
          </Text>
        ) : null}
        <Text variant="title" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {meta ? <Text color="textSecondary">{meta}</Text> : null}
        {badge ? (
          <View style={{ marginTop: spacing.xs }}>
            <StatusBadge label={badge} tone="accent" />
          </View>
        ) : null}
        <View style={[styles.rule, { backgroundColor: colors.border }]} />

        <HtmlContent html={html} fontSize={fontSize} query={query} onScripture={setReference} justify />

        {footer}

        {previous || next ? (
          <View style={styles.nav}>
            {previous ? <NavCard dir="prev" link={previous} /> : <View style={{ flex: 1 }} />}
            {next ? <NavCard dir="next" link={next} /> : <View style={{ flex: 1 }} />}
          </View>
        ) : null}
      </ScrollView>

      <ScriptureSheet reference={reference} onClose={() => setReference(null)} />

      <Sheet visible={showPrefs} onClose={() => setShowPrefs(false)} title="Reading settings" scroll={false}>
        <Text variant="label" color="textSecondary">
          Text size
        </Text>
        <View style={styles.sizeRow}>
          <IconButton
            icon={Minus}
            accessibilityLabel="Smaller text"
            onPress={() => setFontSize(fontSize - 1)}
            disabled={fontSize <= FONT_MIN}
          />
          <Text variant="heading" accessibilityLiveRegion="polite">
            {fontSize}
          </Text>
          <IconButton
            icon={Plus}
            accessibilityLabel="Larger text"
            onPress={() => setFontSize(fontSize + 1)}
            disabled={fontSize >= FONT_MAX}
          />
        </View>
        <Text variant="label" color="textSecondary" style={{ marginTop: spacing.md }}>
          Background
        </Text>
        <View style={styles.surfaceRow}>
          <Chip label="Default" selected={surface === "default"} onPress={() => setSurface("default")} />
          <Chip label="Sepia" selected={surface === "sepia"} onPress={() => setSurface("sepia")} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function NavCard({ dir, link }: { dir: "prev" | "next"; link: ReaderLink }) {
  const { colors } = useTheme();
  const isNext = dir === "next";
  return (
    <Card
      onPress={link.onPress}
      style={{ flex: 1 }}
      accessibilityLabel={`${isNext ? "Next" : "Previous"}: ${link.title}`}
    >
      <View style={[styles.navHead, { justifyContent: isNext ? "flex-end" : "flex-start" }]}>
        {!isNext ? <ChevronLeft size={16} color={colors.primary} /> : null}
        <Text variant="caption" color="primary">
          {isNext ? "Next" : "Previous"}
        </Text>
        {isNext ? <ChevronRight size={16} color={colors.primary} /> : null}
      </View>
      <Text variant="label" numberOfLines={3} align={isNext ? "right" : "left"} style={{ marginTop: 4 }}>
        {link.title}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  progress: { height: 3, borderTopRightRadius: radius.sm, borderBottomRightRadius: radius.sm },
  content: { paddingHorizontal: spacing.gutter, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  title: { marginTop: spacing.xxs, marginBottom: spacing.xxs },
  rule: { height: 1, marginVertical: spacing.lg },
  nav: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  navHead: { flexDirection: "row", alignItems: "center", gap: 4 },
  sizeRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.xs },
  surfaceRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
});
