import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { removeSubscription, saveSubscription } from "@/lib/pushStore";
import { isAllowedPushEndpoint } from "@/lib/webPush";

export const dynamic = "force-dynamic";

async function readEndpoint(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  } | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint || endpoint.length > 2048 || !isAllowedPushEndpoint(endpoint)) {
    return { error: NextResponse.json({ error: "Invalid push subscription" }, { status: 400 }) };
  }
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 256) : undefined);
  return { endpoint, keys: { p256dh: str(body?.keys?.p256dh), auth: str(body?.keys?.auth) } };
}

/** POST /api/push/subscribe: this browser wants service reminders. */
export async function POST(req: NextRequest) {
  const limited = await rateLimitMiddleware(req, "public");
  if (limited) return limited;
  const parsed = await readEndpoint(req);
  if (parsed.error) return parsed.error;
  try {
    await saveSubscription({ endpoint: parsed.endpoint, keys: parsed.keys });
    return NextResponse.json({ subscribed: true }, { status: 201 });
  } catch (err) {
    console.error("[push/subscribe] save failed:", err);
    return NextResponse.json({ error: "Could not save the subscription" }, { status: 500 });
  }
}

/** DELETE /api/push/subscribe: stop reminders for this browser. */
export async function DELETE(req: NextRequest) {
  const limited = await rateLimitMiddleware(req, "public");
  if (limited) return limited;
  const parsed = await readEndpoint(req);
  if (parsed.error) return parsed.error;
  try {
    await removeSubscription(parsed.endpoint);
    return NextResponse.json({ subscribed: false });
  } catch (err) {
    console.error("[push/subscribe] delete failed:", err);
    return NextResponse.json({ error: "Could not remove the subscription" }, { status: 500 });
  }
}
