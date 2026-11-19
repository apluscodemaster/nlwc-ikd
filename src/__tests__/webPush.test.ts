import { afterEach, describe, expect, it, vi } from "vitest";
import { createPublicKey, generateKeyPairSync, verify } from "crypto";
import { isAllowedPushEndpoint, sendPush, vapidJwt, type VapidConfig } from "@/lib/webPush";
import { dueReminder } from "@/lib/serviceReminders";

function keys(): VapidConfig {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const pub = publicKey.export({ format: "jwk" });
  const raw = Buffer.concat([Buffer.from([4]), Buffer.from(pub.x!, "base64url"), Buffer.from(pub.y!, "base64url")]);
  return {
    publicKey: raw.toString("base64url"),
    privateKey: privateKey.export({ format: "jwk" }).d!,
    subject: "mailto:test@example.org",
  };
}

describe("web push (VAPID)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("signs a JWT the public key verifies, for the push service's origin", () => {
    const config = keys();
    const jwt = vapidJwt("https://fcm.googleapis.com", config, Date.UTC(2026, 10, 19));
    const [h, c, sig] = jwt.split(".");
    const claims = JSON.parse(Buffer.from(c, "base64url").toString());
    expect(claims).toMatchObject({ aud: "https://fcm.googleapis.com", sub: "mailto:test@example.org" });
    expect(claims.exp).toBe(Date.UTC(2026, 10, 19) / 1000 + 12 * 3600);
    const pub = Buffer.from(config.publicKey, "base64url");
    const key = createPublicKey({
      key: { kty: "EC", crv: "P-256", x: pub.subarray(1, 33).toString("base64url"), y: pub.subarray(33).toString("base64url") },
      format: "jwk",
    });
    const ok = verify("sha256", Buffer.from(`${h}.${c}`), { key, dsaEncoding: "ieee-p1363" }, Buffer.from(sig, "base64url"));
    expect(ok).toBe(true);
  });

  it("only talks to real push services", () => {
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(isAllowedPushEndpoint("https://web.push.apple.com/QGx")).toBe(true);
    expect(isAllowedPushEndpoint("https://evil.example.com/fcm.googleapis.com")).toBe(false);
    expect(isAllowedPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("not a url")).toBe(false);
  });

  it("sends a body-less push with VAPID auth and reports gone subscriptions", async () => {
    const config = keys();
    const fetchMock = vi.fn(async () => ({ ok: false, status: 410 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendPush("https://fcm.googleapis.com/fcm/send/abc", config)).toBe("gone");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization.startsWith("vapid t=")).toBe(true);
    expect(headers.Authorization.endsWith(`, k=${config.publicKey}`)).toBe(true);
    expect(headers.Authorization.split(", ")[0].split(".")).toHaveLength(3);
    expect(headers.TTL).toBe("1800");
    expect(init.body).toBeUndefined();

    fetchMock.mockResolvedValueOnce({ ok: true, status: 201 });
    expect(await sendPush("https://fcm.googleapis.com/fcm/send/abc", config)).toBe("sent");
  });
});

describe("dueReminder", () => {
  const start = new Date("2026-11-22T08:00:00+01:00");
  const next = { date: start, label: "Sunday Worship Service", formattedDate: "" };
  const at = (minutesBefore: number) => new Date(start.getTime() - minutesBefore * 60_000);

  it("is due from about 40 minutes before the start until it starts", () => {
    expect(dueReminder(at(45), next)).toBeNull();
    expect(dueReminder(at(30), next)).toMatchObject({
      key: start.toISOString(),
      title: "Sunday Worship Service starts in 30 minutes",
      url: "/live",
    });
    expect(dueReminder(at(30), next)?.body).toContain("8:00 AM Lagos time");
    expect(dueReminder(at(3), next)?.title).toBe("Sunday Worship Service starts now");
    expect(dueReminder(at(0), next)).toBeNull();
    expect(dueReminder(at(5), null)).toBeNull();
  });
});
