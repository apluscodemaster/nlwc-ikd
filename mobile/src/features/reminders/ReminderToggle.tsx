import { useState } from "react";
import { Alert, Linking, View } from "react-native";
import { BellOff, BellRing } from "~/components/icons";
import { Button, Text } from "~/components";
import { spacing } from "~/theme";
import { disableServiceReminders, enableServiceReminders, remindersEnabled } from "./serviceReminders";

/** "Remind me before services" switch (Live tab, off air). */
export function ReminderToggle() {
  const [on, setOn] = useState(remindersEnabled);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) {
        await disableServiceReminders();
        setOn(false);
        return;
      }
      if (await enableServiceReminders()) {
        setOn(true);
        Alert.alert("Reminders on", "We'll remind you about 30 minutes before each service.");
      } else {
        Alert.alert(
          "Notifications are off",
          "Allow notifications for NLWC Ikorodu in your phone's settings to get service reminders.",
          [
            { text: "Not now", style: "cancel" },
            { text: "Open settings", onPress: () => void Linking.openSettings() },
          ],
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
      <Button
        title={on ? "Turn off service reminders" : "Remind me before services"}
        variant={on ? "ghost" : "secondary"}
        icon={on ? BellOff : BellRing}
        loading={busy}
        fullWidth
        onPress={() => void toggle()}
      />
      {on ? (
        <Text variant="small" color="textMuted" style={{ textAlign: "center" }}>
          You&apos;ll get a notification about 30 minutes before each service.
        </Text>
      ) : null}
    </View>
  );
}
