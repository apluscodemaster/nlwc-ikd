import { Alert, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "~/components/icons";
import { Button, Card, Chip, Screen, SectionHeader, Text } from "~/components";
import { FONT_MAX, FONT_MIN, useReaderPrefs } from "~/features/reader/readerPrefs";
import { API_BASE_URL, APP_VARIANT, APP_VERSION } from "~/lib/config";
import { queryPersister } from "~/lib/queryClient";
import { spacing, useTheme, type ThemePreference } from "~/theme";

export default function SettingsScreen() {
  const { preference, setPreference } = useTheme();
  const { fontSize, setFontSize } = useReaderPrefs();
  const qc = useQueryClient();

  const clearCache = () =>
    Alert.alert("Clear saved content?", "Messages and articles you've opened will need to download again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          qc.clear();
          await queryPersister.removeClient();
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Settings" }} />
      <SectionHeader label="Appearance" />
      <Card>
        <Text variant="label" color="textSecondary">
          Theme
        </Text>
        <View style={styles.row}>
          {(["system", "light", "dark"] as ThemePreference[]).map((p) => (
            <Chip key={p} label={p === "system" ? "Match device" : p[0].toUpperCase() + p.slice(1)} selected={preference === p} onPress={() => setPreference(p)} />
          ))}
        </View>
        <Text variant="label" color="textSecondary" style={{ marginTop: spacing.md }}>
          Reading text size
        </Text>
        <View style={styles.row}>
          {[FONT_MIN, 17, 18, 20, 22, FONT_MAX].map((s) => (
            <Chip key={s} label={String(s)} selected={fontSize === s} onPress={() => setFontSize(s)} />
          ))}
        </View>
      </Card>

      <SectionHeader label="Storage" />
      <Card>
        <Text color="textSecondary">The app keeps what you've opened so it works offline.</Text>
        <Button title="Clear saved content" icon={Trash2} variant="secondary" onPress={clearCache} style={{ marginTop: spacing.sm }} />
      </Card>

      <SectionHeader label="About this app" />
      <Card>
        <Text variant="small" color="textSecondary">
          Version {APP_VERSION} ({APP_VARIANT})
        </Text>
        <Text variant="small" color="textMuted">
          {API_BASE_URL}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs } });
