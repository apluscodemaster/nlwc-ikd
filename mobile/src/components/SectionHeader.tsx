import { Pressable, StyleSheet, View } from "react-native";
import { spacing } from "~/theme";
import { Text } from "./Text";

interface SectionHeaderProps {
  /** Small uppercase overline (web SectionLabel). */
  label: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ label, title, actionLabel = "See all", onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text variant="caption" color="primary" accessibilityRole="header">
          {label}
        </Text>
        {title ? (
          <Text variant="heading" style={styles.title}>
            {title}
          </Text>
        ) : null}
      </View>
      {onAction ? (
        <Pressable accessibilityRole="link" onPress={onAction} hitSlop={12}>
          <Text variant="label" color="primary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  flex: { flex: 1 },
  title: { marginTop: 2 },
});
