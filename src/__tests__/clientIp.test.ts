import { describe, expect, it } from "vitest";
import { getClientIp } from "@/lib/clientIp";

const req = (headers: Record<string, string>) => ({ headers: new Headers(headers) });

describe("getClientIp", () => {
  it("prefers Netlify's own client header over anything the client sent", () => {
    expect(
      getClientIp(req({ "x-nf-client-connection-ip": "203.0.113.9", "x-forwarded-for": "1.1.1.1, 203.0.113.9" })),
    ).toBe("203.0.113.9");
  });

  it("uses the right-most forwarded hop, not a spoofed left-most one", () => {
    expect(getClientIp(req({ "x-forwarded-for": "6.6.6.6, 198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("falls back to x-real-ip, then null", () => {
    expect(getClientIp(req({ "x-real-ip": "192.0.2.1" }))).toBe("192.0.2.1");
    expect(getClientIp(req({}))).toBeNull();
  });
});
