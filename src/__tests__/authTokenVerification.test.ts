import { describe, it, expect, beforeAll } from "vitest";
import { verifyAuthHeader } from "@/lib/auth";
import type { NextRequest } from "next/server";

/**
 * Regression test for a full authentication bypass.
 *
 * When the Firebase Admin SDK isn't initialised, verifyFirebaseToken() falls
 * back to a manual check. That fallback used to base64-decode the JWT payload
 * and validate iss/aud/exp/sub WITHOUT ever verifying the signature — so any
 * attacker could mint a token with the right claims and a garbage signature and
 * be treated as an admin on every requireAuth() route.
 *
 * The claims aren't secret either: the project id comes from
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID, which ships in the client bundle.
 *
 * These tests run with no Admin credentials, i.e. down that exact fallback path.
 */

const PROJECT_ID = "test-project-id";

function b64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function requestWith(token: string): NextRequest {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "authorization" ? `Bearer ${token}` : null,
    },
  } as unknown as NextRequest;
}

/** A token whose CLAIMS are perfect — only the signature is fake. */
function forgeToken(overrides: Record<string, unknown> = {}): string {
  const now = Math.floor(Date.now() / 1000);
  return [
    b64url({ alg: "RS256", typ: "JWT", kid: "forged-key-id" }),
    b64url({
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      aud: PROJECT_ID,
      exp: now + 3600,
      iat: now - 10,
      sub: "attacker-uid",
      ...overrides,
    }),
    Buffer.from("this-is-not-a-real-signature").toString("base64url"),
  ].join(".");
}

beforeAll(() => {
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = PROJECT_ID;
});

describe("verifyAuthHeader — forged token rejection", () => {
  it("rejects a forged token even though every claim is valid", async () => {
    const token = forgeToken();

    // Prove the claims really would have satisfied the old checks, so the
    // rejection below is due to the signature and nothing else.
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf-8"),
    );
    expect(payload.iss).toBe(`https://securetoken.google.com/${PROJECT_ID}`);
    expect(payload.aud).toBe(PROJECT_ID);
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(payload.sub).toBeTruthy();

    const result = await verifyAuthHeader(requestWith(token));
    expect(result.isValid).toBe(false);
  });

  it("rejects a forged token claiming a far-future expiry", async () => {
    const result = await verifyAuthHeader(
      requestWith(forgeToken({ exp: Math.floor(Date.now() / 1000) + 10_000_000 })),
    );
    expect(result.isValid).toBe(false);
  });

  it("rejects tokens with a non-RS256 algorithm (alg confusion)", async () => {
    const now = Math.floor(Date.now() / 1000);
    const noneToken = [
      b64url({ alg: "none", typ: "JWT" }),
      b64url({
        iss: `https://securetoken.google.com/${PROJECT_ID}`,
        aud: PROJECT_ID,
        exp: now + 3600,
        iat: now - 10,
        sub: "attacker-uid",
      }),
      "",
    ].join(".");
    const result = await verifyAuthHeader(requestWith(noneToken));
    expect(result.isValid).toBe(false);
  });

  it("rejects a missing Authorization header", async () => {
    const req = {
      headers: { get: () => null },
    } as unknown as NextRequest;
    expect((await verifyAuthHeader(req)).isValid).toBe(false);
  });

  it("rejects a non-Bearer scheme", async () => {
    const req = {
      headers: { get: () => "Basic abc123" },
    } as unknown as NextRequest;
    expect((await verifyAuthHeader(req)).isValid).toBe(false);
  });

  it("rejects a structurally malformed token", async () => {
    expect((await verifyAuthHeader(requestWith("not.a.jwt"))).isValid).toBe(
      false,
    );
  });
});
