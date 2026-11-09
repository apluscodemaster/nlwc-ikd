import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { spacing } from "~/theme";
import { Text } from "./Text";

/** Port of the web OfflineDetector: a slim bar while the device is offline. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((s) => {
        setOffline(s.isConnected === false || s.isInternetReachable === false);
      }),
    [],
  );

  if (!offline) return null;
  return (
    <View style={styles.bar} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <WifiOff size={14} color="#FFFFFF" />
      <Text variant="small" style={styles.text}>
        You're offline. Showing saved content.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: "#374151",
    paddingVertical: 6,
  },
  text: { color: "#FFFFFF" },
});
