import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Platform, useColorScheme } from "react-native";
import { palette, type Colors } from "./tokens";
import { kv } from "~/lib/storage";

/** "system" follows the OS; the others override it (as next-themes did on web). */
export type ThemePreference = "system" | "light" | "dark";

const PREF_KEY = "nlwc-theme-preference";

interface ThemeContextValue {
  scheme: "light" | "dark";
  colors: Colors;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  /** Shadow style for cards; a border is used instead in dark mode. */
  cardShadow: object;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>(
    () => (kv.getString(PREF_KEY) as ThemePreference | null) ?? "system",
  );

  const setPreference = useCallback((p: ThemePreference) => {
    setPref(p);
    kv.setString(PREF_KEY, p);
  }, []);

  const scheme: "light" | "dark" = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;

  const value = useMemo<ThemeContextValue>(() => {
    const colors = palette[scheme];
    const cardShadow =
      scheme === "dark"
        ? { borderWidth: 1, borderColor: colors.border }
        : Platform.select({
            ios: {
              shadowColor: "#111827",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            },
            default: { elevation: 2 },
          })!;
    return { scheme, colors, preference, setPreference, cardShadow };
  }, [scheme, preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
