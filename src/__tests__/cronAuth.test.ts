import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { rejectUnlessCron } from "@/lib/cronAuth";

const request = (authorization?: string) =>
  new NextRequest("https://example.com/api/cron/job", {
    headers: authorization ? { authorization } : {},
  });

describe("rejectUnlessCron", () => {
  const original = process.env.CRON_SECRET;
  afterEach(() => {
    process.env.CRON_SECRET = original;
  });

  it("refuses every call when CRON_SECRET is not configured", () => {
    delete process.env.CRON_SECRET;
    expect(rejectUnlessCron(request("Bearer anything"))?.status).toBe(500);
  });

  it("refuses a missing or wrong secret", () => {
    process.env.CRON_SECRET = "s3cret";
    expect(rejectUnlessCron(request())?.status).toBe(401);
    expect(rejectUnlessCron(request("Bearer wrong"))?.status).toBe(401);
    expect(rejectUnlessCron(request("s3cret"))?.status).toBe(401);
  });

  it("allows Vercel Cron's Authorization header", () => {
    process.env.CRON_SECRET = "s3cret";
    expect(rejectUnlessCron(request("Bearer s3cret"))).toBeNull();
  });
});
