import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { rejectUnlessCron } from "@/lib/cronAuth";
import {
  createSpecialService,
  getSpecialServices,
} from "@/lib/scheduleService";
import { specialEventsForMonth } from "@/lib/specialEvents";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/special-services — monthly, on the 15th.
 *
 * Adds NEXT month's rule-based special services (Sithrah, its Thursday/Friday
 * preparatory prayers, and the Season of the Spirit Sundays in Feb/early
 * March) to the schedule. They were only ever seeded once, when the schedule
 * was empty, so after the first month an admin had to add each one by hand or
 * it never appeared in Upcoming Events or the live/chat windows.
 *
 * Running on the 15th gives about three weeks' notice (the next Sithrah is on
 * the 8th–14th) and only touches next month, so an entry an admin deletes or
 * edits for the current month is never re-created. Entries that already exist
 * (same date and title, active or not) are skipped, so a re-run or a manually
 * added entry never produces duplicates.
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnlessCron(request);
  if (denied) return denied;

  // "Next month" by the Lagos calendar (WAT = UTC+1, no daylight saving).
  const lagosNow = new Date(Date.now() + 60 * 60 * 1000);
  const year = lagosNow.getUTCFullYear();
  const month = lagosNow.getUTCMonth() + 1;
  const target = { year: month > 11 ? year + 1 : year, month: month % 12 };

  try {
    const existing = await getSpecialServices();
    const seen = new Set(existing.map((s) => `${s.date}|${s.label}`));

    const due = specialEventsForMonth(target.year, target.month).filter(
      (e) => !seen.has(`${e.date}|${e.label}`),
    );
    const created = await Promise.all(due.map((e) => createSpecialService(e)));

    if (created.length > 0) {
      try {
        revalidatePath("/api/schedule");
      } catch (err) {
        console.warn("[cron/special-services] revalidate failed:", err);
      }
    }

    const summary = created.map((c) => `${c.date} ${c.label}`);
    console.log(
      `[cron/special-services] ${target.year}-${String(target.month + 1).padStart(2, "0")}: added ${created.length}`,
      summary,
    );
    return NextResponse.json({
      month: `${target.year}-${String(target.month + 1).padStart(2, "0")}`,
      added: summary,
      skippedExisting:
        specialEventsForMonth(target.year, target.month).length - due.length,
    });
  } catch (err) {
    console.error("[cron/special-services] failed:", err);
    return NextResponse.json(
      { error: "Failed to add special services" },
      { status: 500 },
    );
  }
}
