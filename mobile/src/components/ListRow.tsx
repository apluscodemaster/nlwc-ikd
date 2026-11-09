import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ChevronRight, type LucideIcon } from "~/components/icons";
import { radius, spacing, useTheme } from "~/theme";
import { Text } from "./Text";

interface ListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  thumbnail?: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
  onPress?: () => void;
  /** 0–1; shows a thin progress bar under the text (partly listened). */
  progress?: number;
  showChevron?: boolean;
  accessibilityLabel?: string;
}

export function ListRow({
  title,
  subtitle,
  meta,
  thumbnail,
  icon: Icon,
  trailing,
  onPress,
  progress,
  showChevron,
  accessibilityLabel,
}: ListRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel ?? [title, subtitle, meta].filter(Boolean).join(", ")}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      {thumbnail ? (
        <Image
          source={{ uri: thumbnail }}
          style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]}
          contentFit="cover"
          transition={150}
          recyclingKey={thumbnail}
        />
      ) : Icon ? (
        <View style={[styles.thumb, styles.iconThumb, { backgroundColor: colors.accentSoft }]}>
          <Icon size={22} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={2} dense>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" color="textSecondary" numberOfLines={1} dense>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="small" color="textMuted" numberOfLines={1} dense>
            {meta}
          </Text>
        ) : null}
        {progress != null && progress > 0 ? (
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: colors.primary, width: `${Math.min(100, Math.round(progress * 100))}%` },
              ]}
            />
          </View>
        ) : null}
      </View>
      {trailing}
      {showChevron ? <ChevronRight size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.gutter,
    minHeight: 64,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.md },
  iconThumb: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  track: { height: 3, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  fill: { height: 3 },
});
