import { StyleSheet, View } from "react-native";
import { Text } from "~/components";
import { splitDuration } from "~/lib/dates";
import { radius, spacing, useTheme } from "~/theme";

/** Days / hours / minutes / seconds tiles (port of ServiceCountdown). */
export function Countdown({ seconds, compact }: { seconds: number; compact?: boolean }) {
  const { colors } = useTheme();
  const { d, h, m, s } = splitDuration(seconds);
  const units = [
    { v: d, l: "Days" },
    { v: h, l: "Hours" },
    { v: m, l: "Mins" },
    { v: s, l: "Secs" },
  ];
  // Announce once a minute, not every second (DESIGN.md §7).
  const a11y = `Starts in ${d} days, ${h} hours, ${m} minutes`;

  return (
    <View style={styles.row} accessible accessibilityLabel={a11y}>
      {units.map((u) => (
        <View
          key={u.l}
          style={[
            styles.tile,
            compact && styles.compact,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          importantForAccessibility="no-hide-descendants"
        >
          <Text variant={compact ? "heading" : "display"} style={{ fontVariant: ["tabular-nums"] }}>
            {String(u.v).padStart(2, "0")}
          </Text>
          <Text variant="caption" color="textMuted">
            {u.l}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
  tile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  compact: { paddingVertical: spacing.xs },
});
