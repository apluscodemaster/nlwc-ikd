import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WifiOff } from "~/components/icons";
import { radius, spacing } from "~/theme";
import { Text } from "./Text";

/** Clearance for the tab bar + mini player, so the pill never covers them. */
const BOTTOM_CLEARANCE = 130;

/**
 * Port of the web OfflineDetector: a small floating pill while the device has
 * no network connection at all.
 *
 * Deliberately ignores NetInfo's `isInternetReachable`: that probes a Google
 * URL, which some networks (corporate, some hotspots/ISPs) block, and would
 * report "offline" while the church API works fine. Real request failures
 * already show their own error/retry states.
 *
 * Floats above the tab bar instead of sitting at the top, so it can't overlap
 * the status bar or shift screen layouts.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => NetInfo.addEventListener((s) => setOffline(s.isConnected === false)), []);

  if (!offline) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + BOTTOM_CLEARANCE }]}>
      <View style={styles.pill} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <WifiOff size={14} color="#FFFFFF" />
        <Text variant="small" style={styles.text}>
          You're offline. Showing saved content.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 10, elevation: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#374151",
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  text: { color: "#FFFFFF" },
});
