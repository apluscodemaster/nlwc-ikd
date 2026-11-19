#!/usr/bin/env node
/**
 * Generates the VAPID key pair for service-reminder push notifications
 * (src/lib/webPush.ts). Uses Node's crypto only; run once:
 *
 *   node scripts/generate-vapid-keys.mjs
 *
 * Put both values in Vercel (Project → Settings → Environment Variables) and
 * redeploy. Keep the private key secret. Changing the keys later means every
 * browser has to turn reminders on again.
 */
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });
const raw = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pub.x, "base64url"),
  Buffer.from(pub.y, "base64url"),
]);

console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${raw.toString("base64url")}`);
console.log(`VAPID_PRIVATE_KEY=${priv.d}`);
