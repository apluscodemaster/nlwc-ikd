import { NextRequest, NextResponse } from "next/server";
import { rejectUnlessCron } from "@/lib/cronAuth";
import { TARGETS_BY_TYPE, revalidateTargets } from "@/lib/revalidateTargets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";

/**
 * GET /api/cron/release-refresh — daily, shortly after the 00:30 WAT release
 * slot (see utils/publishSchedule and vercel.json).
 *
 * Scheduled manuals/transcripts are released by WordPress itself, flipping
 * "future" → "publish". But wp-cron only runs when something requests the
 * WordPress site, so in the quiet hours a due post can sit unpublished — and
 * the frontend only notices once its cache windows lapse. This job:
 *
 *   1. requests wp-cron.php, which publishes every post that is now due;
 *   2. marks the manual and transcript pages stale, so the next visitor gets
 *      the newly released content instead of waiting out the cache.
 *
 * Both steps are idempotent; running it twice is harmless.
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnlessCron(request);
  if (denied) return denied;

  let wpCron: string;
  try {
    const res = await fetch(`${WP_URL}/wp-cron.php?doing_wp_cron`, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    wpCron = `HTTP ${res.status}`;
  } catch (err) {
    // Still refresh the pages: WordPress may have released the posts on its
    // own, and a stale page is the part this job can always fix.
    wpCron = `failed: ${err instanceof Error ? err.message : String(err)}`;
    console.warn("[cron/release-refresh] wp-cron ping failed:", err);
  }

  const revalidated = revalidateTargets([
    ...TARGETS_BY_TYPE.manual,
    ...TARGETS_BY_TYPE.transcript,
  ]);

  console.log(
    `[cron/release-refresh] wp-cron ${wpCron}; revalidated`,
    revalidated.join(", "),
  );
  return NextResponse.json({ wpCron, revalidated });
}
