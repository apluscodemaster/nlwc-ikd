import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { typography, useTheme, type ColorName, type TypographyVariant } from "~/theme";

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorName;
  align?: "left" | "center" | "right";
  /** Cap font scaling on dense rows so layouts don't break (DESIGN.md §2). */
  dense?: boolean;
}

export function Text({
  variant = "body",
  color = "text",
  align,
  dense,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={dense ? 1.4 : undefined}
      {...rest}
      style={[typography[variant], { color: colors[color] }, align && { textAlign: align }, style]}
    />
  );
}
