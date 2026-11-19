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

describe("admin auth vs anonymous chat sign-ins", () => {
  it("rejects an anonymous Firebase session (live chat), even with no ADMIN_EMAILS", async () => {
    delete process.env.ADMIN_EMAILS;
    verifyIdToken.mockResolvedValueOnce({
      uid: "anon-1",
      firebase: { sign_in_provider: "anonymous" },
    });
    expect((await verifyAuthHeader(request)).isValid).toBe(false);
  });

  it("still accepts a real (password) account", async () => {
    delete process.env.ADMIN_EMAILS;
    verifyIdToken.mockResolvedValueOnce({
      uid: "admin-1",
      email: "admin@example.org",
      firebase: { sign_in_provider: "password" },
    });
    const result = await verifyAuthHeader(request);
    expect(result).toMatchObject({
      isValid: true,
      actor: { uid: "admin-1", email: "admin@example.org" },
    });
  });
});
