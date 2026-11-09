import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { LucideIcon } from "~/components/icons";
import { HIT, radius, spacing, useTheme } from "~/theme";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  title: string;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  trailing?: ReactNode;
}

const HEIGHT: Record<Size, number> = { sm: 36, md: HIT, lg: 52 };

export function Button({
  title,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading,
  disabled,
  fullWidth,
  style,
  trailing,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.surfaceMuted,
    ghost: "transparent",
    destructive: colors.danger,
  };
  const fg: Record<Variant, string> = {
    primary: colors.onPrimary,
    secondary: colors.text,
    ghost: colors.primary,
    destructive: "#FFFFFF",
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      accessibilityLabel={title}
      disabled={isDisabled}
      hitSlop={size === "sm" ? 4 : 0}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: size === "sm" ? spacing.sm : spacing.lg,
          backgroundColor: pressed && variant === "primary" ? colors.primaryPressed : bg[variant],
          opacity: isDisabled ? 0.55 : pressed && variant !== "primary" ? 0.7 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={size === "sm" ? 16 : 18} color={fg[variant]} /> : null}
          <Text variant="label" style={{ color: fg[variant], fontSize: size === "lg" ? 16 : 14 }}>
            {title}
          </Text>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});
