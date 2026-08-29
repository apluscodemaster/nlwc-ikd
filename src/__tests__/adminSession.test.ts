import { describe, it, expect, beforeEach } from "vitest";
import {
  IDLE_TIMEOUT_MS,
  beginTabSession,
  endTabSession,
  markActivity,
  getIdleMs,
  checkSession,
  msUntilIdleTimeout,
} from "@/lib/adminSession";

const T0 = 1_700_000_000_000;

describe("adminSession", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  describe("the reported bug: closing the tab must end the session", () => {
    it("rejects a credential restored with no tab marker", () => {
      // Simulates Firebase replaying a localStorage credential in a brand-new
      // tab: storage is empty because the browser cleared sessionStorage.
      const result = checkSession(T0);
      expect(result.ok).toBe(false);
      expect(result).toMatchObject({ reason: "no-tab-session" });
    });

    it("accepts a session that actually signed in in this tab", () => {
      beginTabSession(T0);
      const result = checkSession(T0 + 1000);
      expect(result.ok).toBe(true);
    });

    it("rejects again once the tab session is cleared on sign-out", () => {
      beginTabSession(T0);
      expect(checkSession(T0).ok).toBe(true);

      endTabSession();
      expect(checkSession(T0)).toMatchObject({
        ok: false,
        reason: "no-tab-session",
      });
    });
  });

  describe("idle deadline survives a reload", () => {
    it("expires once the idle timeout has elapsed", () => {
      beginTabSession(T0);
      expect(checkSession(T0 + IDLE_TIMEOUT_MS - 1).ok).toBe(true);
      expect(checkSession(T0 + IDLE_TIMEOUT_MS)).toMatchObject({
        ok: false,
        reason: "idle-expired",
      });
    });

    it("does not reset the clock just because the page re-mounted", () => {
      beginTabSession(T0);
      // 40 minutes pass with the tab open but the page reloaded — the stored
      // timestamp is the only thing that matters.
      expect(checkSession(T0 + 40 * 60 * 1000)).toMatchObject({
        ok: false,
        reason: "idle-expired",
      });
    });

    it("extends the deadline on recorded activity", () => {
      beginTabSession(T0);
      markActivity(T0 + 20 * 60 * 1000);
      expect(checkSession(T0 + 40 * 60 * 1000).ok).toBe(true);
    });

    it("ignores activity when there is no live tab session", () => {
      markActivity(T0);
      expect(checkSession(T0)).toMatchObject({
        ok: false,
        reason: "no-tab-session",
      });
    });
  });

  describe("clock skew", () => {
    it("treats a backwards clock jump as zero idle rather than negative", () => {
      beginTabSession(T0);
      expect(getIdleMs(T0 - 60_000)).toBe(0);
    });
  });

  describe("msUntilIdleTimeout", () => {
    it("counts down from the stored activity stamp", () => {
      beginTabSession(T0);
      expect(msUntilIdleTimeout(T0)).toBe(IDLE_TIMEOUT_MS);
      expect(msUntilIdleTimeout(T0 + 10 * 60 * 1000)).toBe(
        IDLE_TIMEOUT_MS - 10 * 60 * 1000,
      );
    });

    it("is 0 with no session, so callers expire immediately", () => {
      expect(msUntilIdleTimeout(T0)).toBe(0);
    });
  });
});
