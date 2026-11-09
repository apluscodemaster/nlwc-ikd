/**
 * Design tokens (docs/DESIGN.md §2). Values come from the website's
 * src/app/globals.css and the Tailwind classes it actually uses.
 */

export const palette = {
  light: {
    primary: "#FF7C18",
    primaryPressed: "#E86A0C",
    onPrimary: "#FFFFFF",
    accent: "#F59E0B",
    accentSoft: "#FFF7ED",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    surfaceMuted: "#F3F4F6",
    text: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",
    border: "#E5E7EB",
    danger: "#DC2626",
    success: "#16A34A",
    live: "#EF4444",
    info: "#2563EB",
    overlay: "rgba(17,24,39,0.45)",
    sepia: "#F8F1E3",
  },
  dark: {
    primary: "#FF8A33",
    primaryPressed: "#FF9A47",
    onPrimary: "#0B0B0F",
    accent: "#FBBF24",
    accentSoft: "#2A1A0B",
    background: "#0B0B0F",
    surface: "#16161C",
    surfaceMuted: "#22222A",
    text: "#F5F5F5",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",
    border: "#2A2A33",
    danger: "#FF6467",
    success: "#22C55E",
    live: "#F87171",
    info: "#60A5FA",
    overlay: "rgba(0,0,0,0.6)",
    sepia: "#2B261D",
  },
} as const;

export type ColorName = keyof (typeof palette)["light"];
export type Colors = Record<ColorName, string>;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  /** Horizontal screen gutter */
  gutter: 16,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/** Jost (the website's font) by weight; see app/_layout.tsx for loading. */
export const fonts = {
  regular: "Jost_400Regular",
  medium: "Jost_500Medium",
  semibold: "Jost_600SemiBold",
  bold: "Jost_700Bold",
} as const;

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 25 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  reader: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 30 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Minimum touch target (pt). */
export const HIT = 44;
