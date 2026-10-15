import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Guard for the scheduled-job routes under /api/cron.
 *
 * Vercel Cron calls each route with `Authorization: Bearer <CRON_SECRET>`
 * (CRON_SECRET is a project environment variable). The same header lets an
 * admin trigger a job by hand, e.g.
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/<job>
 *
 * Returns a response to send back when the request is NOT allowed, or null.
 * With CRON_SECRET unset every call is refused, so a job can never be left
 * publicly triggerable by a missing variable.
 */
export function rejectUnlessCron(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not configured; refusing to run");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  const ok =
    given.length === expected.length && timingSafeEqual(given, expected);

  return ok
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
