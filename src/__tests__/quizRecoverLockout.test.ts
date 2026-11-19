import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({ getAdminDb: () => ({}) }));

import {
  MAX_FAILURES,
  WINDOW_MS,
  lockedUntil,
  nextLockoutState,
} from "@/lib/quizRecoverLockout.server";

describe("quiz recovery lockout (per name)", () => {
  const t0 = Date.UTC(2026, 10, 19, 12);

  it("locks a name after five failures within an hour, until the hour is up", () => {
    let state = undefined as ReturnType<typeof nextLockoutState> | undefined;
    for (let i = 1; i < MAX_FAILURES; i++) {
      state = nextLockoutState(state, t0 + i * 60_000);
      expect(lockedUntil(state, t0 + i * 60_000)).toBeNull();
    }
    state = nextLockoutState(state, t0 + 10 * 60_000);
    expect(state.failures).toBe(MAX_FAILURES);
    // The window started at the first failure (t0 + 1 min).
    expect(lockedUntil(state, t0 + 11 * 60_000)).toBe(t0 + 60_000 + WINDOW_MS);
    expect(lockedUntil(state, t0 + 60_000 + WINDOW_MS)).toBeNull();
  });

  it("starts a fresh window once the hour has passed", () => {
    const old = { failures: 4, windowStart: t0 };
    expect(nextLockoutState(old, t0 + WINDOW_MS + 1)).toEqual({
      failures: 1,
      windowStart: t0 + WINDOW_MS + 1,
    });
    expect(nextLockoutState(old, t0 + 1000)).toEqual({
      failures: 5,
      windowStart: t0,
    });
  });
});
