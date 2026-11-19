import { useEffect } from "react";
import { AppState } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { SERVICE_REMINDER_KIND, syncServiceReminders } from "./serviceReminders";

/**
 * Keeps service reminders in step with the admin schedule (on launch and
 * whenever the app returns to the foreground), and opens the Live tab when
 * a reminder is tapped. Renders nothing.
 */
export function ServiceRemindersBridge() {
  const router = useRouter();

  useEffect(() => {
    void syncServiceReminders();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void syncServiceReminders();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      if (response?.notification.request.content.data?.kind === SERVICE_REMINDER_KIND) {
        router.navigate("/live");
      }
    };
    // A tap that launched the app.
    void Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [router]);

  return null;
}
