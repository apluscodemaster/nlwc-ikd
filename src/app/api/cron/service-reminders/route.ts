import { NextRequest, NextResponse } from "next/server";
import { rejectUnlessCron } from "@/lib/cronAuth";
import { applySchedule, getNextService } from "@/lib/liveSchedule";
import {
  claimReminder,
  listSubscriptionEndpoints,
  removeSubscription,
  setLatestMessage,
} from "@/lib/pushStore";
import { getRecurringServices, getSpecialServices } from "@/lib/scheduleService";
import { dueReminder } from "@/lib/serviceReminders";
import { sendPush, vapidConfig } from "@/lib/webPush";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONCURRENCY = 20;

/**
 * GET /api/cron/service-reminders, every ~10 minutes (GitHub Actions,
 * .github/workflows/service-reminders.yml: Vercel's Hobby plan only runs
 * cron jobs daily).
 *
 * When the next service on the admin schedule starts within about 30
 * minutes, sends one push to every browser that turned reminders on. Each
 * service start is sent once (push_sent), however often the job runs.
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnlessCron(request);
  if (denied) return denied;

  const config = vapidConfig();
  if (!config) {
    return NextResponse.json({ skipped: "VAPID keys are not configured" });
  }

  try {
    const [recurring, special] = await Promise.all([getRecurringServices(), getSpecialServices()]);
    applySchedule({ recurring, special });
    const now = new Date();
    let next = null;
    try {
      next = getNextService(now);
    } catch {
      next = null;
    }
    const reminder = dueReminder(now, next);
    if (!reminder) return NextResponse.json({ due: false });

    if (!(await claimReminder(reminder.key, { title: reminder.title }))) {
      return NextResponse.json({ due: true, alreadySent: true });
    }
    await setLatestMessage({
      title: reminder.title,
      body: reminder.body,
      url: reminder.url,
      sentAt: now.toISOString(),
    });

    const endpoints = await listSubscriptionEndpoints();
    const counts = { sent: 0, gone: 0, failed: 0 };
    for (let i = 0; i < endpoints.length; i += CONCURRENCY) {
      const batch = endpoints.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map((e) => sendPush(e, config)));
      await Promise.all(
        results.map((r, j) => {
          counts[r]++;
          return r === "gone" ? removeSubscription(batch[j]).catch(() => {}) : null;
        }),
      );
    }
    console.log("[cron/service-reminders]", reminder.title, counts);
    return NextResponse.json({ due: true, reminder: reminder.title, ...counts });
  } catch (err) {
    console.error("[cron/service-reminders] failed:", err);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
