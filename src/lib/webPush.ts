/**
 * Minimal Web Push sender (RFC 8030 + VAPID, RFC 8292) using Node's crypto.
 *
 * Pushes carry NO payload: the service worker fetches the text to show from
 * /api/push/message when a push arrives. A body-less push needs no message
 * encryption (RFC 8291), only the signed VAPID header, so no third-party
 * library is involved.
 *
 * Keys: NEXT_PUBLIC_VAPID_PUBLIC_KEY (browsers subscribe with it) and
 * VAPID_PRIVATE_KEY, both base64url, from `node scripts/generate-vapid-keys.mjs`.
 * VAPID_SUBJECT is a contact for push services (mailto: or https: URL).
 */
import { createPrivateKey, sign, type KeyObject } from "crypto";

/** Push services browsers use. Anything else is refused (no requests to arbitrary URLs). */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/, // Chrome, Edge (Chromium), Android
  /^android\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/, // legacy Edge
  /^web\.push\.apple\.com$/, // Safari (macOS, iOS home-screen apps)
  /(^|\.)push\.apple\.com$/,
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

const b64url = (buf: Buffer) => buf.toString("base64url");

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export function vapidConfig(): VapidConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  const subject =
    process.env.VAPID_SUBJECT?.trim() ||
    (process.env.CHURCH_EMAIL_ADDRESS
      ? `mailto:${process.env.CHURCH_EMAIL_ADDRESS}`
      : "https://ikorodu.nlwc.church");
  return { publicKey, privateKey, subject };
}

/** The P-256 private key from its base64url `d` and the public key's x/y. */
function vapidKey({ publicKey, privateKey }: VapidConfig): KeyObject {
  const pub = Buffer.from(publicKey, "base64url");
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not an uncompressed P-256 key");
  }
  return createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: privateKey,
      x: b64url(pub.subarray(1, 33)),
      y: b64url(pub.subarray(33, 65)),
    },
    format: "jwk",
  });
}

/** The signed VAPID JWT (ES256) for a push service origin. */
export function vapidJwt(audience: string, config: VapidConfig, now = Date.now()): string {
  const header = b64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64url(
    Buffer.from(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(now / 1000) + 12 * 60 * 60,
        sub: config.subject,
      }),
    ),
  );
  const input = `${header}.${claims}`;
  const signature = sign("sha256", Buffer.from(input), {
    key: vapidKey(config),
    dsaEncoding: "ieee-p1363",
  });
  return `${input}.${b64url(signature)}`;
}

export type PushResult = "sent" | "gone" | "failed";

/**
 * Send one body-less push. "gone" means the subscription no longer exists
 * (the browser unsubscribed or the user blocked notifications): delete it.
 */
export async function sendPush(
  endpoint: string,
  config: VapidConfig,
  { ttlSeconds = 30 * 60, urgency = "high" }: { ttlSeconds?: number; urgency?: string } = {},
): Promise<PushResult> {
  if (!isAllowedPushEndpoint(endpoint)) return "gone";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        TTL: String(ttlSeconds),
        Urgency: urgency,
        "Content-Length": "0",
        Authorization: `vapid t=${vapidJwt(new URL(endpoint).origin, config)}, k=${config.publicKey}`,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
