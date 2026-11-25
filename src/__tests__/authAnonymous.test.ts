import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// The Admin SDK verifies the token; what matters is how its result is used.
const verifyIdToken = vi.fn();
vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken }),
  getAdminDb: () => ({}),
}));

import { verifyAuthHeader } from "@/lib/auth";

const request = {
  headers: {
    get: (n: string) =>
      n.toLowerCase() === "authorization" ? "Bearer some.signed.token" : null,
  },
} as unknown as NextRequest;

describe("admin auth: only accounts with the admin claim", () => {
  it("rejects an anonymous Firebase session (live chat)", async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: "anon-1",
      firebase: { sign_in_provider: "anonymous" },
    });
    expect((await verifyAuthHeader(request)).isValid).toBe(false);
  });

  it("rejects a real account without the admin claim (e.g. a public sign-up)", async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: "stranger-1",
      email: "stranger@example.org",
      firebase: { sign_in_provider: "password" },
    });
    const result = await verifyAuthHeader(request);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/not an administrator/);
  });

  it("does not accept a truthy-but-not-true claim", async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: "odd-1",
      email: "odd@example.org",
      admin: "yes",
      firebase: { sign_in_provider: "password" },
    });
    expect((await verifyAuthHeader(request)).isValid).toBe(false);
  });

  it("accepts an account with admin: true", async () => {
    verifyIdToken.mockResolvedValueOnce({
      uid: "admin-1",
      email: "admin@example.org",
      admin: true,
      firebase: { sign_in_provider: "password" },
    });
    const result = await verifyAuthHeader(request);
    expect(result).toMatchObject({
      isValid: true,
      actor: { uid: "admin-1", email: "admin@example.org", admin: true },
    });
  });
});
