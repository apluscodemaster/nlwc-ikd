import { describe, expect, it } from "vitest";
import { toCdnAudioUrl } from "@/utils/audioUrl";

const CDN = "https://d1234abcd.cloudfront.net/";
const key = "/sermons/2026/11/the-power-of-faith.mp3";

describe("toCdnAudioUrl", () => {
  it("serves sermon MP3s from the CDN, keeping the path", () => {
    expect(
      toCdnAudioUrl(
        `https://nlwc-ikorodu.s3.us-east-2.amazonaws.com${key}`,
        CDN,
      ),
    ).toBe(`https://d1234abcd.cloudfront.net${key}`);
    expect(
      toCdnAudioUrl(
        `https://s3.us-east-2.amazonaws.com/nlwc-ikorodu${key}?x=1`,
        CDN,
      ),
    ).toBe(`https://d1234abcd.cloudfront.net${key}?x=1`);
  });

  it("leaves other hosts, other buckets and an unset CDN alone", () => {
    const drive =
      "https://drive.usercontent.google.com/download?id=abc&export=download&confirm=t";
    expect(toCdnAudioUrl(drive, CDN)).toBe(drive);
    const other = `https://other-bucket.s3.us-east-2.amazonaws.com${key}`;
    expect(toCdnAudioUrl(other, CDN)).toBe(other);
    const s3 = `https://nlwc-ikorodu.s3.us-east-2.amazonaws.com${key}`;
    expect(toCdnAudioUrl(s3, "")).toBe(s3);
    expect(toCdnAudioUrl(s3, "http://insecure.example.com")).toBe(s3);
    expect(toCdnAudioUrl(undefined, CDN)).toBeUndefined();
  });
});

import { validAudioUrl } from "@/utils/audioUrl";

describe("validAudioUrl", () => {
  it("keeps real links and drops text saved in the audio field", () => {
    expect(
      validAudioUrl(" https://nlwc-ikorodu.s3.us-east-2.amazonaws.com/a.mp3 "),
    ).toBe("https://nlwc-ikorodu.s3.us-east-2.amazonaws.com/a.mp3");
    expect(
      validAudioUrl(
        "Overcoming Sin by the Law of the Spirit of Life in Christ",
      ),
    ).toBeUndefined();
    expect(validAudioUrl("")).toBeUndefined();
    expect(validAudioUrl(undefined)).toBeUndefined();
  });
});
