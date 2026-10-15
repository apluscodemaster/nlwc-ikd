import { NextRequest, NextResponse } from "next/server";
import { rejectUnlessCron } from "@/lib/cronAuth";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHAT_COLLECTION = "live-chat";

/** How long chat messages are kept — long enough to review a recent service. */
const RETENTION_DAYS = 7;

/** Firestore allows up to 500 writes per batch; stay under it. */
const BATCH_SIZE = 400;

/** Upper bound per run so a huge backlog can't exceed the function timeout;
 *  anything left over is picked up by the next day's run. */
const MAX_BATCHES = 50;

/**
 * GET /api/cron/purge-live-chat — daily.
 *
 * The live chat only ever SHOWS the current service's messages (a query filter
 * in liveChatService), but nothing deleted the old ones: every message, with
 * the sender's name, stayed in Firestore forever. This removes messages older
 * than RETENTION_DAYS.
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnlessCron(request);
  if (denied) return denied;

  const db = getAdminDb();
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  let deleted = 0;
  let batches = 0;
  try {
    while (batches < MAX_BATCHES) {
      // `timestamp` is Unix ms (see liveChatService.sendChatMessage).
      const snapshot = await db
        .collection(CHAT_COLLECTION)
        .where("timestamp", "<", cutoff)
        .limit(BATCH_SIZE)
        .get();
      if (snapshot.empty) break;

      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      deleted += snapshot.size;
      batches++;
      if (snapshot.size < BATCH_SIZE) break;
    }
  } catch (err) {
    console.error("[cron/purge-live-chat] failed after", deleted, err);
    return NextResponse.json(
      { error: "Purge failed", deleted },
      { status: 500 },
    );
  }

  const more = batches >= MAX_BATCHES;
  console.log(
    `[cron/purge-live-chat] deleted ${deleted} message(s) older than ${RETENTION_DAYS} days${more ? " (more remain)" : ""}`,
  );
  return NextResponse.json({
    deleted,
    retentionDays: RETENTION_DAYS,
    moreRemaining: more,
  });
}
