// Server-only: per-name lockout for quiz progress recovery.
//
// /api/quiz/recover is also rate-limited per IP, but someone guessing a
// player's security answer can change networks. This counts failed attempts
// per *name* instead: after MAX_FAILURES wrong answers or codes within
// WINDOW_MS, that name can't be recovered with an answer or code until the
// window ends (admin recovery links still work). Stored in Firestore
// (quiz_recover_lockouts), so it holds across server instances.
import { createHash } from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";

export const MAX_FAILURES = 5;
export const WINDOW_MS = 60 * 60 * 1000;
const COLLECTION = "quiz_recover_lockouts";

interface LockoutDoc {
  failures: number;
  /** Epoch ms of the first failure in the current window. */
  windowStart: number;
}

const docFor = (username: string) =>
  getAdminDb()
    .collection(COLLECTION)
    .doc(
      createHash("sha256").update(username.trim().toLowerCase()).digest("hex"),
    );

/** The lockout state after one more failure (pure; exported for tests). */
export function nextLockoutState(
  prev: LockoutDoc | undefined,
  now: number,
): LockoutDoc {
  if (!prev || now - prev.windowStart >= WINDOW_MS)
    return { failures: 1, windowStart: now };
  return { failures: prev.failures + 1, windowStart: prev.windowStart };
}

/** When the name unlocks (epoch ms), or null when it isn't locked. */
export function lockedUntil(
  state: LockoutDoc | undefined,
  now: number,
): number | null {
  if (!state || state.failures < MAX_FAILURES) return null;
  const until = state.windowStart + WINDOW_MS;
  return now < until ? until : null;
}

export async function getLockout(username: string): Promise<number | null> {
  try {
    const snap = await docFor(username).get();
    return lockedUntil(
      snap.exists ? (snap.data() as LockoutDoc) : undefined,
      Date.now(),
    );
  } catch (err) {
    // Fail open: a Firestore hiccup shouldn't stop honest players.
    console.error("[quiz/recover] lockout read failed:", err);
    return null;
  }
}

export async function recordFailure(username: string): Promise<void> {
  try {
    const ref = docFor(username);
    await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      tx.set(
        ref,
        nextLockoutState(
          snap.exists ? (snap.data() as LockoutDoc) : undefined,
          Date.now(),
        ),
      );
    });
  } catch (err) {
    console.error("[quiz/recover] lockout write failed:", err);
  }
}

export async function clearFailures(username: string): Promise<void> {
  try {
    await docFor(username).delete();
  } catch {
    // Nothing to clear, or Firestore unavailable: the window expires anyway.
  }
}
