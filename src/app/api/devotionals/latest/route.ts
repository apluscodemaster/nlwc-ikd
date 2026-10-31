import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * GET /api/devotionals/latest — the newest released devotional, for the
 * homepage prompt.
 *
 * The prompt used to query Firestore from the browser, which pulled the whole
 * Firebase client SDK (Firestore + Auth, ~100 KB) into the homepage just to
 * read one document. Read server-side instead, cached for 5 minutes (ISR), so
 * a newly released devotional appears within 5 minutes.
 */
export const revalidate = 300;

interface LatestDevotional {
  id: string;
  title: string;
  /** ISO timestamp of the release date. */
  scheduledDate: string;
}

export async function GET() {
  try {
    const snap = await getAdminDb()
      .collection("devotionals")
      .where("scheduledDate", "<=", new Date())
      .orderBy("scheduledDate", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ devotional: null });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const devotional: LatestDevotional = {
      id: doc.id,
      title: String(data.title ?? ""),
      scheduledDate: data.scheduledDate.toDate().toISOString(),
    };
    return NextResponse.json({ devotional });
  } catch (error) {
    console.error("Failed to load latest devotional:", error);
    return NextResponse.json({ devotional: null }, { status: 500 });
  }
}
