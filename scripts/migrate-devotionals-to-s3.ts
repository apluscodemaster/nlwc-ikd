/**
 * One-off: move existing devotional PDFs from Cloudinary to S3
 * (nlwc-ikorodu/Daily_Devotionals/) and point each devotional at its new copy.
 *
 *   npx jiti scripts/migrate-devotionals-to-s3.ts           # dry run: shows the plan
 *   npx jiti scripts/migrate-devotionals-to-s3.ts --apply   # does it
 *
 * Reads .env.local (Firebase Admin + AWS keys). For each devotional still on
 * Cloudinary it downloads the PDF, checks it really is a PDF, uploads it
 * (public read), checks the new link opens, and only then updates the
 * Firestore document: pdfUrl and storagePath change, and the old values are
 * kept as previousPdfUrl / previousStoragePath. The Cloudinary files are NOT
 * deleted. Safe to re-run: devotionals already on S3 are skipped, and the S3
 * key is derived from the Cloudinary id, so a re-run overwrites, not duplicates.
 */
import { readFileSync } from "node:fs";
import * as admin from "firebase-admin";
import { headObject, s3Config } from "../src/lib/s3.server";
import {
  DEVOTIONALS_PREFIX,
  isS3DevotionalKey,
  slugify,
  uploadDevotionalPdf,
} from "../src/lib/devotionalFiles.server";

const APPLY = process.argv.includes("--apply");
/** --limit=N moves at most N (for a first test run). */
const LIMIT = Number(/--limit=([0-9]+)/.exec(process.argv.join(" "))?.[1] ?? Infinity);

function loadEnv(file: string) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    // Never turn off certificate checks for the files being moved.
    if (m && m[1] === "NODE_TLS_REJECT_UNAUTHORIZED") continue;
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

/** Daily_Devotionals/<name>.pdf from the Cloudinary id ("devotionals/faith-ab12"). */
function keyFor(
  storagePath: string | undefined,
  title: string,
  id: string,
): string {
  const base = (storagePath || "").split("/").pop() || "";
  return `${DEVOTIONALS_PREFIX}${slugify(base || `${title}-${id.slice(0, 6)}`)}.pdf`;
}

async function main() {
  loadEnv(process.env.ENV_FILE || ".env.local");
  const s3 = s3Config();
  if (!s3)
    throw new Error(
      "AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY missing from .env.local",
    );

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:
        process.env.FIREBASE_ADMIN_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  const db = admin.firestore();

  const snap = await db.collection("devotionals").get();
  console.log(
    `${snap.size} devotionals · bucket ${s3.bucket} (${s3.region}) · ${APPLY ? "APPLYING" : "dry run"}\n`,
  );

  // Two devotionals must never share a file.
  const seen = new Map<string, string>();
  for (const doc of snap.docs) {
    const d = doc.data() as { title?: string; storagePath?: string };
    if (isS3DevotionalKey(d.storagePath)) continue;
    const key = keyFor(d.storagePath, d.title || doc.id, doc.id);
    if (seen.has(key))
      throw new Error(
        `Two devotionals map to ${key}: ${seen.get(key)} and ${doc.id}`,
      );
    seen.set(key, doc.id);
  }

  const counts = { moved: 0, skipped: 0, failed: 0 };
  for (const doc of snap.docs) {
    const d = doc.data() as {
      title?: string;
      pdfUrl?: string;
      storagePath?: string;
    };
    const title = d.title || doc.id;
    if (isS3DevotionalKey(d.storagePath)) {
      counts.skipped++;
      console.log(`· skip   ${title} (already on S3)`);
      continue;
    }
    if (!d.pdfUrl) {
      counts.failed++;
      console.log(`✗ FAIL   ${title}: no pdfUrl`);
      continue;
    }
    const key = keyFor(d.storagePath, title, doc.id);
    if (!APPLY) {
      console.log(`→ move   ${title}\n         ${d.pdfUrl}\n         → ${key}`);
      continue;
    }

    try {
      const res = await fetch(d.pdfUrl);
      if (!res.ok) throw new Error(`download ${res.status}`);
      const body = Buffer.from(await res.arrayBuffer());
      if (body.length < 100 || body.subarray(0, 5).toString() !== "%PDF-")
        throw new Error("download isn't a PDF");

      const url = await uploadDevotionalPdf(s3, key, body);
      const head = await headObject(s3, key);
      if (!head.exists || head.size !== body.length)
        throw new Error("upload size mismatch");
      const check = await fetch(url);
      const first = Buffer.from(await check.arrayBuffer())
        .subarray(0, 5)
        .toString();
      if (!check.ok || first !== "%PDF-")
        throw new Error(`new link didn't open (${check.status})`);

      await doc.ref.update({
        pdfUrl: url,
        storagePath: key,
        previousPdfUrl: d.pdfUrl,
        previousStoragePath: d.storagePath ?? null,
        migratedToS3At: new Date(), // stored as a Firestore timestamp
      });
      counts.moved++;
      console.log(
        `✓ moved  ${title} (${(body.length / 1024 / 1024).toFixed(1)} MB) → ${key}`,
      );
    } catch (err) {
      counts.failed++;
      console.log(
        `✗ FAIL   ${title}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(
    `\n${APPLY ? `Moved ${counts.moved}` : `Would move ${snap.size - counts.skipped - counts.failed}`}, ` +
      `skipped ${counts.skipped}, failed ${counts.failed}.` +
      (APPLY ? "" : "\nRun again with --apply to do it."),
  );
  if (counts.failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
