/**
 * One-time migration: Remove the `difficulty` field from all quiz_questions
 * documents in Firestore.
 *
 * Usage:
 *   npx tsx scripts/remove-difficulty-field.ts
 *
 * Requires FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
 * and FIREBASE_ADMIN_PRIVATE_KEY environment variables (loaded from .env.local).
 */

import * as admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv dependency needed)
function loadEnv(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local may not exist; rely on existing env vars
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n",
);

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

async function main() {
  const snapshot = await db.collection("quiz_questions").get();
  let updated = 0;

  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if ("difficulty" in data) {
      batch.update(doc.ref, {
        difficulty: admin.firestore.FieldValue.delete(),
      });
      updated++;
    }
  }

  if (updated > 0) {
    await batch.commit();
    console.log(
      `✓ Removed "difficulty" field from ${updated} / ${snapshot.size} documents.`,
    );
  } else {
    console.log(
      `No documents had a "difficulty" field (${snapshot.size} checked).`,
    );
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
