/**
 * Firestore storage for service-reminder push notifications (server only).
 *
 * push_subscriptions/{sha256(endpoint)}  one browser that asked for reminders
 * push_meta/latest                       the reminder the service worker shows
 * push_sent/{key}                        one per reminder sent (no duplicates)
 */
import { createHash } from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";

const SUBSCRIPTIONS = "push_subscriptions";
const META = "push_meta";
const SENT = "push_sent";

export interface PushMessage {
  title: string;
  body: string;
  /** Page to open when the notification is tapped. */
  url: string;
  /** ISO timestamp. */
  sentAt: string;
}

const idFor = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex");

export async function saveSubscription(sub: {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
}): Promise<void> {
  await getAdminDb()
    .collection(SUBSCRIPTIONS)
    .doc(idFor(sub.endpoint))
    .set(
      {
        endpoint: sub.endpoint,
        // Unused while pushes carry no payload; kept for future use.
        keys: { p256dh: sub.keys?.p256dh ?? "", auth: sub.keys?.auth ?? "" },
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await getAdminDb().collection(SUBSCRIPTIONS).doc(idFor(endpoint)).delete();
}

export async function listSubscriptionEndpoints(): Promise<string[]> {
  const snap = await getAdminDb().collection(SUBSCRIPTIONS).select("endpoint").get();
  return snap.docs.map((d) => d.get("endpoint") as string).filter(Boolean);
}

export async function getLatestMessage(): Promise<PushMessage | null> {
  const snap = await getAdminDb().collection(META).doc("latest").get();
  return snap.exists ? (snap.data() as PushMessage) : null;
}

export async function setLatestMessage(message: PushMessage): Promise<void> {
  await getAdminDb().collection(META).doc("latest").set(message);
}

/**
 * Claim a reminder so it is sent once, even if the job runs twice at once.
 * True when this call claimed it; false when it was already sent.
 */
export async function claimReminder(key: string, info: Record<string, unknown>): Promise<boolean> {
  try {
    await getAdminDb()
      .collection(SENT)
      .doc(key)
      .create({ ...info, claimedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    // ALREADY_EXISTS (gRPC code 6): another run sent it.
    if ((err as { code?: number }).code === 6) return false;
    throw err;
  }
}
