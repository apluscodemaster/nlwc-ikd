import { NextResponse } from "next/server";
import { getLatestMessage } from "@/lib/pushStore";

export const dynamic = "force-dynamic";

const FALLBACK = {
  title: "NLWC Ikorodu",
  body: "A service is starting soon. Tap to join the live stream.",
  url: "/live",
};

/**
 * GET /api/push/message: what the service worker shows when a push arrives
 * (pushes carry no payload, see lib/webPush). Public: it only ever holds
 * the latest service reminder.
 */
export async function GET() {
  try {
    const latest = await getLatestMessage();
    // A stale message (e.g. a push delivered hours late) gets the generic text.
    const fresh =
      latest && Date.now() - new Date(latest.sentAt).getTime() < 3 * 60 * 60 * 1000;
    return NextResponse.json(fresh ? latest : FALLBACK, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(FALLBACK, { headers: { "Cache-Control": "no-store" } });
  }
}
