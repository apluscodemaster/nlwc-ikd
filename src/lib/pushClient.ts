/**
 * Browser side of service reminders: subscribe this browser to web push and
 * register it with /api/push/subscribe.
 */

export type ReminderState =
  /** Not set up on the server (no NEXT_PUBLIC_VAPID_PUBLIC_KEY). */
  | "unconfigured"
  /** This browser can't receive web push. */
  | "unsupported"
  /** iPhone/iPad Safari: web push only works once the site is on the Home Screen. */
  | "ios-install"
  /** Notifications are blocked for this site in the browser settings. */
  | "denied"
  | "off"
  | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac with touch.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob((base64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  // ServiceWorkerProvider registers /sw.js; register here too in case it hasn't yet.
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function getReminderState(): Promise<ReminderState> {
  if (typeof window === "undefined") return "unsupported";
  if (!PUBLIC_KEY) return "unconfigured";
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIos() && !isStandalone() ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const sub = await (await registration()).pushManager.getSubscription();
    return sub && Notification.permission === "granted" ? "on" : "off";
  } catch {
    return "off";
  }
}

async function send(method: "POST" | "DELETE", sub: PushSubscription): Promise<void> {
  const res = await fetch("/api/push/subscribe", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) throw new Error(`Reminder request failed (${res.status})`);
}

/** Ask permission (must run from a tap) and turn reminders on. */
export async function enableReminders(): Promise<ReminderState> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  const reg = await registration();
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(PUBLIC_KEY),
    }));
  await send("POST", sub);
  return "on";
}

export async function disableReminders(): Promise<ReminderState> {
  const sub = await (await registration()).pushManager.getSubscription();
  if (sub) {
    await send("DELETE", sub).catch(() => {});
    await sub.unsubscribe();
  }
  return "off";
}
