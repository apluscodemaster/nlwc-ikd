import { describe, it, expect } from "vitest";
import {
  toStreamableAudioUrl,
  extractDriveFileId,
  isGoogleDriveUrl,
} from "@/utils/audioUrl";

const ID = "1iKklMCl__bWgrkPwx3XnFxf2NyZOi_DR";
const EXPECTED = `https://drive.usercontent.google.com/download?id=${ID}&export=download&confirm=t`;

describe("extractDriveFileId", () => {
  it("reads the id from a Share / mobile-app view link", () => {
    expect(
      extractDriveFileId(
        `https://drive.google.com/file/d/${ID}/view?usp=drivesdk`,
      ),
    ).toBe(ID);
  });

  it("reads the id from the short /d/ form", () => {
    expect(extractDriveFileId(`https://drive.google.com/d/${ID}`)).toBe(ID);
  });

  it("reads the id from an ?id= query parameter", () => {
    expect(
      extractDriveFileId(`https://drive.google.com/uc?export=download&id=${ID}`),
    ).toBe(ID);
  });

  it("returns null when there is no id", () => {
    expect(extractDriveFileId("https://drive.google.com/drive/my-drive")).toBe(
      null,
    );
    expect(extractDriveFileId("")).toBe(null);
  });
});

describe("isGoogleDriveUrl", () => {
  it("recognises drive, docs and the download host", () => {
    expect(isGoogleDriveUrl("https://drive.google.com/file/d/x/view")).toBe(true);
    expect(isGoogleDriveUrl("https://docs.google.com/uc?id=x")).toBe(true);
    expect(
      isGoogleDriveUrl("https://drive.usercontent.google.com/download?id=x"),
    ).toBe(true);
  });

  it("rejects everything else", () => {
    expect(
      isGoogleDriveUrl("https://nlwc-ikorodu.s3.us-east-2.amazonaws.com/a.mp3"),
    ).toBe(false);
    expect(isGoogleDriveUrl("")).toBe(false);
  });
});

describe("toStreamableAudioUrl", () => {
  it("rewrites the share link that the Drive app produces", () => {
    expect(
      toStreamableAudioUrl(
        `https://drive.google.com/file/d/${ID}/view?usp=drivesdk`,
      ),
    ).toBe(EXPECTED);
  });

  it("rewrites the uc?export=download form to the direct host", () => {
    expect(
      toStreamableAudioUrl(
        `https://drive.google.com/uc?export=download&id=${ID}`,
      ),
    ).toBe(EXPECTED);
  });

  it("leaves an S3 link untouched", () => {
    const s3 = "https://nlwc-ikorodu.s3.us-east-2.amazonaws.com/msg.mp3";
    expect(toStreamableAudioUrl(s3)).toBe(s3);
  });

  it("leaves an already-direct download URL untouched", () => {
    // Preserves hand-tuned params (resourcekey, an existing confirm token).
    const direct = `https://drive.usercontent.google.com/download?id=${ID}&export=download&confirm=t&resourcekey=abc`;
    expect(toStreamableAudioUrl(direct)).toBe(direct);
  });

  it("leaves a Drive URL with no file id alone rather than breaking it", () => {
    const folder = "https://drive.google.com/drive/folders";
    expect(toStreamableAudioUrl(folder)).toBe(folder);
  });

  it("trims surrounding whitespace from a pasted link", () => {
    expect(
      toStreamableAudioUrl(`  https://drive.google.com/file/d/${ID}/view  `),
    ).toBe(EXPECTED);
  });

  it("passes empty values straight through", () => {
    expect(toStreamableAudioUrl("")).toBe("");
    expect(toStreamableAudioUrl(undefined)).toBe(undefined);
  });

  it("is idempotent", () => {
    const once = toStreamableAudioUrl(
      `https://drive.google.com/file/d/${ID}/view?usp=drivesdk`,
    );
    expect(toStreamableAudioUrl(once)).toBe(once);
  });
});
