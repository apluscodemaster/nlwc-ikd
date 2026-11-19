import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "~/components/icons";
import { HIT, radius, useTheme, type ColorName } from "~/theme";

export interface IconButtonProps extends Omit<PressableProps, "style" | "children"> {
  icon: LucideIcon;
  /** Required: icon-only controls must be labelled (DESIGN.md §7). */
  accessibilityLabel: string;
  size?: number;
  color?: ColorName;
  filled?: boolean;
  /** Raw colour override (e.g. white on a photo viewer). */
  tint?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon: Icon, size = 20, color = "text", filled, tint, style, ...rest }: IconButtonProps) {
  const { colors } = useTheme();
  const dim = Math.max(HIT, size + 20);
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: dim,
          height: dim,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: filled ? colors.primary : "transparent",
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <Icon size={size} color={tint ?? (filled ? colors.onPrimary : colors[color])} />
    </Pressable>
  );
}
