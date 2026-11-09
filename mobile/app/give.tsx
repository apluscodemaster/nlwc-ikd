import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Check, Copy } from "~/components/icons";
import { Button, Card, Screen, Text } from "~/components";
import { GIVING_OPTIONS } from "~/data/giving";
import { radius, spacing, useTheme } from "~/theme";

/** Giving: bank transfer details with copy (web /give). */
export default function GiveScreen() {
  const { colors } = useTheme();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, number: string) => {
    await Clipboard.setStringAsync(number);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Give" }} />
      <Text variant="title">Partner with us</Text>
      <Text color="textSecondary" style={{ marginBottom: spacing.lg }}>
        “Every man according as he purposeth in his heart, so let him give… for God loveth a cheerful giver.” 2 Corinthians 9:7
      </Text>
      <View style={{ gap: spacing.md }}>
        {GIVING_OPTIONS.map((o) => (
          <Card key={o.id}>
            <View style={styles.head}>
              <Image source={{ uri: o.logo }} style={[styles.logo, { backgroundColor: colors.surfaceMuted }]} contentFit="contain" />
              <View style={{ flex: 1 }}>
                <Text variant="heading">{o.title}</Text>
                <Text variant="small" color="textSecondary">
                  {o.description}
                </Text>
              </View>
            </View>
            <View style={[styles.box, { backgroundColor: colors.surfaceMuted }]}>
              <Text variant="caption" color="textMuted">
                Bank
              </Text>
              <Text variant="bodyStrong">{o.bankName}</Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
                Account number
              </Text>
              <Text variant="title" selectable style={{ letterSpacing: 1 }}>
                {o.accountNumber}
              </Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
                Account name
              </Text>
              <Text variant="bodyStrong" selectable>
                {o.accountName}
              </Text>
            </View>
            <Button
              title={copied === o.id ? "Copied" : "Copy account number"}
              icon={copied === o.id ? Check : Copy}
              variant={copied === o.id ? "secondary" : "primary"}
              fullWidth
              onPress={() => copy(o.id, o.accountNumber)}
            />
            {o.note ? (
              <Text variant="small" color="textSecondary" style={{ marginTop: spacing.sm }}>
                {o.note}
              </Text>
            ) : null}
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  logo: { width: 48, height: 48, borderRadius: radius.md },
  box: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
});
