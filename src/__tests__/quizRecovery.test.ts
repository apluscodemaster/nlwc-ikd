import { describe, it, expect, vi } from "vitest";

// quizRecovery.server imports the Supabase admin client at module load; the
// primitives under test never touch it.
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({}) }));

import {
  generateRecoveryCode,
  hashRecoveryCode,
  signClaimToken,
  verifyClaimToken,
  buildRecoveryLink,
} from "@/lib/quizRecovery.server";
import {
  normalizeRecoveryCode,
  formatRecoveryCode,
  RECOVERY_LINK_PARAM,
} from "@/lib/quizSecurity";

describe("recovery codes", () => {
  it("generates 8 chars from the unambiguous alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRecoveryCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    }
  });

  it("formats as XXXX-XXXX and normalises back", () => {
    expect(formatRecoveryCode("kj7q4pxw")).toBe("KJ7Q-4PXW");
    expect(normalizeRecoveryCode(" kj7q-4pxw ")).toBe("KJ7Q4PXW");
  });

  it("hashes case/dash-insensitively and differs per code", () => {
    expect(hashRecoveryCode("KJ7Q-4PXW")).toBe(hashRecoveryCode("kj7q4pxw"));
    expect(hashRecoveryCode("KJ7Q4PXW")).not.toBe(hashRecoveryCode("KJ7Q4PXX"));
    expect(hashRecoveryCode("KJ7Q4PXW")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("claim tokens", () => {
  const payload = { sid: "sess-1", code: "KJ7Q4PXW", exp: Math.floor(Date.now() / 1000) + 3600 };

  it("round-trips a valid token", () => {
    expect(verifyClaimToken(signClaimToken(payload))).toEqual(payload);
  });

  it("rejects a tampered body", () => {
    const token = signClaimToken(payload);
    const [, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...payload, sid: "someone-else" }),
    ).toString("base64url");
    expect(verifyClaimToken(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects a bad signature and malformed input", () => {
    const token = signClaimToken(payload);
    expect(verifyClaimToken(`${token.split(".")[0]}.AAAA`)).toBeNull();
    expect(verifyClaimToken("not-a-token")).toBeNull();
    expect(verifyClaimToken("")).toBeNull();
  });

  it("rejects an expired token", () => {
    const expired = signClaimToken({ ...payload, exp: Math.floor(Date.now() / 1000) - 1 });
    expect(verifyClaimToken(expired)).toBeNull();
  });

  it("builds the quiz link with the token in the recover param", () => {
    const link = buildRecoveryLink("http://localhost:3000", "abc.def");
    const url = new URL(link);
    expect(url.pathname).toBe("/sermons/quiz");
    expect(url.searchParams.get(RECOVERY_LINK_PARAM)).toBe("abc.def");
  });
});
