/**
 * Service reminders in the app: local notifications about 30 minutes before
 * each service on the admin schedule. Scheduled on the phone itself (no push
 * server), from the same schedule the Live tab uses, for the next two weeks;
 * re-synced whenever the app opens, so schedule changes are picked up.
 *
 * Times are absolute instants (DATE triggers) computed in Lagos time, so a
 * phone set to another time zone is still reminded at the right moment.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { kv } from "~/lib/storage";
import { getNextService, isScheduleLoaded, loadScheduleFromApi } from "~/shared";

const ENABLED_KEY = "nlwc-service-reminders";
const CHANNEL_ID = "service-reminders";
const KIND = "service-reminder";
export const REMIND_BEFORE_MS = 30 * 60 * 1000;
const HORIZON_MS = 14 * 24 * 60 * 60 * 1000;
/** iOS keeps at most 64 scheduled notifications per app. */
const MAX_SCHEDULED = 40;

export interface PlannedReminder {
  at: Date;
  title: string;
  body: string;
}

function lagosTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" });
}

/** The reminders due in the next two weeks (exported for tests). */
export function planReminders(now = new Date()): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  let from = now;
  while (out.length < MAX_SCHEDULED) {
    let next;
    try {
      next = getNextService(from);
    } catch {
      break;
    }
    if (!next || Number.isNaN(next.date.getTime()) || next.date.getTime() - now.getTime() > HORIZON_MS) break;
    const at = new Date(next.date.getTime() - REMIND_BEFORE_MS);
    if (at.getTime() > now.getTime()) {
      out.push({
        at,
        title: `${next.label} starts in 30 minutes`,
        body: `${lagosTime(next.date)} Lagos time. Tap to join the live stream and chat.`,
      });
    }
    from = new Date(next.date.getTime() + 60_000);
  }
  return out;
}

export function remindersEnabled(): boolean {
  return kv.getString(ENABLED_KEY) === "1";
}

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Service reminders",
    description: "A reminder about 30 minutes before each service",
    importance: AndroidImportance.HIGH,
  });
}

async function cancelOurs() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind === KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Replace the scheduled reminders with the current schedule's (or none when off). */
export async function syncServiceReminders(): Promise<number> {
  try {
    await cancelOurs();
    if (!remindersEnabled()) return 0;
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return 0;
    if (!isScheduleLoaded()) await loadScheduleFromApi();
    if (!isScheduleLoaded()) return 0;
    await ensureChannel();
    const planned = planReminders();
    for (const r of planned) {
      await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body, data: { kind: KIND, url: "/live" } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL_ID },
      });
    }
    return planned.length;
  } catch (err) {
    console.warn("[reminders] sync failed:", err);
    return 0;
  }
}

/** Turn reminders on (asks for notification permission). False when permission is refused. */
export async function enableServiceReminders(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  const { granted } = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!granted) return false;
  kv.setString(ENABLED_KEY, "1");
  await syncServiceReminders();
  return true;
}

export async function disableServiceReminders(): Promise<void> {
  kv.setString(ENABLED_KEY, "0");
  await cancelOurs();
}

/** Show reminders that arrive while the app is open, too. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const SERVICE_REMINDER_KIND = KIND;
