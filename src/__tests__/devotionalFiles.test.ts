import { describe, expect, it } from "vitest";
import { encodeKey, objectUrl, signRequest } from "@/lib/s3.server";
import {
  isS3DevotionalKey,
  newDevotionalKey,
  slugify,
} from "@/lib/devotionalFiles.server";

describe("devotional files in S3", () => {
  it("names files like the Cloudinary ids were", () => {
    expect(slugify("Prepare the way of the Lord (PT. 2) ")).toBe(
      "prepare-the-way-of-the-lord-pt-2",
    );
    expect(slugify("faith.PDF")).toBe("faith");
    expect(newDevotionalKey("Becoming Little")).toMatch(
      /^Daily_Devotionals\/becoming-little-[a-z0-9]{1,4}\.pdf$/,
    );
  });

  it("tells S3 keys from old Cloudinary ids", () => {
    expect(
      isS3DevotionalKey("Daily_Devotionals/becoming-little-kml9.pdf"),
    ).toBe(true);
    expect(isS3DevotionalKey("devotionals/becoming-little-kml9")).toBe(false);
    expect(isS3DevotionalKey(undefined)).toBe(false);
  });

  it("builds encoded public URLs", () => {
    expect(encodeKey("Daily_Devotionals/a b(1).pdf")).toBe(
      "Daily_Devotionals/a%20b%281%29.pdf",
    );
    expect(
      objectUrl(
        { bucket: "nlwc-ikorodu", region: "us-east-2" },
        "Daily_Devotionals/x.pdf",
      ),
    ).toBe(
      "https://nlwc-ikorodu.s3.us-east-2.amazonaws.com/Daily_Devotionals/x.pdf",
    );
  });

  it("signs requests with SigV4 (scope, signed headers, stable signature)", () => {
    const config = {
      accessKeyId: "AKIDEXAMPLE",
      secretAccessKey: "secret",
      region: "us-east-2",
      bucket: "b",
    };
    const now = new Date("2026-11-21T10:00:00Z");
    const a = signRequest(config, "PUT", "Daily_Devotionals/x.pdf", {
      body: Buffer.from("x"),
      now,
    });
    const b = signRequest(config, "PUT", "Daily_Devotionals/x.pdf", {
      body: Buffer.from("x"),
      now,
    });
    expect(a.Authorization).toBe(b.Authorization);
    expect(a.Authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20261121\/us-east-2\/s3\/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    expect(a["x-amz-date"]).toBe("20261121T100000Z");
    const c = signRequest(config, "PUT", "Daily_Devotionals/x.pdf", {
      body: Buffer.from("y"),
      now,
    });
    expect(c.Authorization).not.toBe(a.Authorization);
  });
});
