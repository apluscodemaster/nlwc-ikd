import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";

// No Upstash env in tests, so this exercises the in-memory fallback.
const req = (path: string, ip: string) =>
  new NextRequest(`https://example.com${path}`, {
    headers: { "x-forwarded-for": ip },
  });

describe("rateLimitMiddleware (in-memory fallback)", () => {
  it("allows the strict tier's 10/min, then answers 429 with Retry-After", async () => {
    for (let i = 0; i < 10; i++) {
      expect(
        await rateLimitMiddleware(req("/api/contact", "1.1.1.1"), "strict"),
      ).toBeNull();
    }
    const blocked = await rateLimitMiddleware(
      req("/api/contact", "1.1.1.1"),
      "strict",
    );
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBe("60");
  });

  it("charges every reference to one bucket on dynamic routes", async () => {
    // Without a bucket each /api/scripture/<ref> had its own allowance.
    for (let i = 0; i < 10; i++) {
      expect(
        await rateLimitMiddleware(
          req(`/api/scripture/John%203:${i}`, "2.2.2.2"),
          "strict",
          "/api/scripture",
        ),
      ).toBeNull();
    }
    const blocked = await rateLimitMiddleware(
      req("/api/scripture/Romans%208:28", "2.2.2.2"),
      "strict",
      "/api/scripture",
    );
    expect(blocked?.status).toBe(429);
  });

  it("counts each client separately", async () => {
    for (let i = 0; i < 10; i++) {
      await rateLimitMiddleware(req("/api/newsletter", "3.3.3.3"), "strict");
    }
    expect(
      await rateLimitMiddleware(req("/api/newsletter", "4.4.4.4"), "strict"),
    ).toBeNull();
  });
});
