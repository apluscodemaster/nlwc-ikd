import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, View, type DimensionValue } from "react-native";
import { AlertCircle, Inbox, WifiOff, type LucideIcon } from "~/components/icons";
import { ApiError } from "~/api/client";
import { radius, spacing, useTheme } from "~/theme";
import { Button } from "./Button";
import { Text } from "./Text";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Inbox, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
        <Icon size={28} color={colors.primary} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      {message ? (
        <Text color="textSecondary" align="center">
          {message}
        </Text>
      ) : null}
      {onAction && actionLabel ? <Button title={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = error instanceof ApiError && error.isNetwork;
  const message =
    error instanceof Error ? error.message : "Something went wrong. Please try again.";
  return (
    <EmptyState
      icon={offline ? WifiOff : AlertCircle}
      title={offline ? "You're offline" : "Couldn't load this"}
      message={message}
      actionLabel={onRetry ? "Try again" : undefined}
      onAction={onRetry}
    />
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center} accessibilityLabel={label} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

/** Pulsing placeholder block (web ui/skeleton). */
export function Skeleton({
  width = "100%",
  height = 16,
  rounded = radius.sm,
}: {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
}) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: rounded, backgroundColor: colors.surfaceMuted, opacity }}
    />
  );
}

/** Skeleton list rows for first load. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View style={{ gap: spacing.md, padding: spacing.gutter }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <Skeleton width={56} height={56} rounded={radius.md} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="85%" />
            <Skeleton width="55%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    gap: spacing.sm,
    minHeight: 240,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  action: { marginTop: spacing.sm, alignSelf: "center" },
});
