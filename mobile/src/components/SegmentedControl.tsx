import { Pressable, StyleSheet, View } from "react-native";
import { radius, spacing, useTheme } from "~/theme";
import { Text } from "./Text";

interface SegmentedControlProps<T extends string> {
  segments: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.wrap, { backgroundColor: colors.surfaceMuted }]}>
      {segments.map((s) => {
        const selected = s.value === value;
        return (
          <Pressable
            key={s.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(s.value)}
            style={[styles.seg, selected && { backgroundColor: colors.surface }]}
          >
            <Text variant="label" dense color={selected ? "text" : "textSecondary"}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", borderRadius: radius.pill, padding: 3 },
  seg: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
  },
});
