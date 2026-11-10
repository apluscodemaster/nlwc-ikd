import { Pressable, ScrollView, StyleSheet } from "react-native";
import type { LucideIcon } from "~/components/icons";
import { radius, spacing, useTheme } from "~/theme";
import { Text } from "./Text";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  /** Share the row equally with sibling chips (label centred, truncates). */
  fill?: boolean;
}

export function Chip({ label, selected, onPress, icon: Icon, fill }: ChipProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimary : colors.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      disabled={!onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [
        styles.chip,
        fill && styles.fill,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {Icon ? <Icon size={14} color={fg} /> : null}
      <Text variant="label" dense style={[{ color: fg }, fill && styles.fillLabel]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

interface ChipRowProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

/** Horizontally scrolling single-select chip row (web filter pills). */
export function ChipRow<T extends string | number>({ options, value, onChange }: ChipRowProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {options.map((o) => (
        <Chip key={String(o.value)} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  fill: { flex: 1, justifyContent: "center", minWidth: 0 },
  // Lets a long label shrink and truncate instead of pushing the chip wider.
  fillLabel: { flexShrink: 1 },
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
});
