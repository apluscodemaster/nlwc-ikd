import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet, View } from "react-native";
import { radius, useTheme, type ColorName } from "~/theme";
import { Text } from "./Text";

interface StatusBadgeProps {
  label: string;
  tone?: ColorName;
  /** Pulsing dot (LIVE). Stops when Reduce Motion is on. */
  pulse?: boolean;
  solid?: boolean;
}

export function StatusBadge({ label, tone = "primary", pulse, solid }: StatusBadgeProps) {
  const { colors } = useTheme();
  const color = colors[tone];
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!pulse) return;
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.6, duration: 650, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 650, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [pulse, scale]);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: solid ? color : `${color}1F`, borderColor: solid ? color : `${color}55` },
      ]}
    >
      {pulse ? (
        <Animated.View style={[styles.dot, { backgroundColor: solid ? "#FFFFFF" : color, transform: [{ scale }] }]} />
      ) : null}
      <Text variant="caption" dense style={{ color: solid ? "#FFFFFF" : color }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
