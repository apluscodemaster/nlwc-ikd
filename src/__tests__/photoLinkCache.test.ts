import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";

// ── Fakes: one Firestore document, and the Google Photos resolver ───────────
let stored: Record<string, { url: string; at: number }> = {};
const saved: Record<string, { url: string; at: number }>[] = [];

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: async () => ({ data: () => ({ entries: stored }) }),
        set: async (data: { entries: typeof stored }) => {
          saved.push(data.entries);
          Object.assign(stored, data.entries);
        },
      }),
    }),
  }),
}));

const resolveMock = vi.fn();
vi.mock("@/utils/driveImage", async (orig) => ({
  ...(await orig<typeof import("@/utils/driveImage")>()),
  resolveGooglePhotosShareLink: (url: string, shouldStart?: () => boolean) =>
    resolveMock(url, shouldStart),
}));

import { resolveImageUrls } from "@/lib/photoLinkCache";

const key = (u: string) =>
  createHash("sha1").update(u).digest("hex").slice(0, 24);
const DAY = 24 * 60 * 60 * 1000;
const share = (n: number) => `https://photos.app.goo.gl/link${n}`;

beforeEach(() => {
  stored = {};
  saved.length = 0;
  resolveMock.mockReset();
});

describe("resolveImageUrls", () => {
  it("serves remembered links without contacting Google", async () => {
    stored[key(share(1))] = {
      url: "https://lh3.googleusercontent.com/pw/A",
      at: Date.now(),
    };
    const { urls, pending } = await resolveImageUrls([share(1)]);
    expect(urls.get(share(1))).toBe("https://lh3.googleusercontent.com/pw/A");
    expect(pending).toBe(0);
    expect(resolveMock).not.toHaveBeenCalled();
    expect(saved).toHaveLength(0); // nothing changed → no write
  });

  it("resolves only new links, and remembers them", async () => {
    stored[key(share(1))] = {
      url: "https://lh3.googleusercontent.com/pw/A",
      at: Date.now(),
    };
    resolveMock.mockResolvedValue("https://lh3.googleusercontent.com/pw/B");
    const { urls } = await resolveImageUrls([share(1), share(2)]);
    expect(resolveMock).toHaveBeenCalledTimes(1);
    expect(resolveMock.mock.calls[0][0]).toBe(share(2));
    expect(urls.get(share(2))).toBe("https://lh3.googleusercontent.com/pw/B");
    expect(stored[key(share(2))].url).toBe(
      "https://lh3.googleusercontent.com/pw/B",
    );
  });

  it("remembers failures and doesn't retry them until the back-off passes", async () => {
    resolveMock.mockResolvedValue("");
    await resolveImageUrls([share(3)]);
    expect(stored[key(share(3))].url).toBe("");
    resolveMock.mockClear();
    const { pending } = await resolveImageUrls([share(3)]);
    expect(resolveMock).not.toHaveBeenCalled();
    expect(pending).toBe(1);

    stored[key(share(3))].at = Date.now() - 7 * 60 * 60 * 1000; // > 6h ago
    resolveMock.mockResolvedValue("https://lh3.googleusercontent.com/pw/C");
    const retry = await resolveImageUrls([share(3)]);
    expect(retry.urls.get(share(3))).toBe(
      "https://lh3.googleusercontent.com/pw/C",
    );
  });

  it("leaves links for later when the time budget runs out", async () => {
    // The resolver honours shouldStart, as the real one does.
    resolveMock.mockImplementation(
      async (_u: string, shouldStart?: () => boolean) =>
        shouldStart && !shouldStart()
          ? undefined
          : "https://lh3.googleusercontent.com/pw/D",
    );
    const { pending, urls } = await resolveImageUrls([share(4), share(5)], {
      budgetMs: -1, // already expired
    });
    expect(pending).toBe(2);
    expect(urls.get(share(4))).toBe("");
    expect(Object.keys(stored)).toHaveLength(0); // skipped ≠ failed: not cached
  });

  it("keeps a working URL when its periodic re-check fails", async () => {
    stored[key(share(6))] = {
      url: "https://lh3.googleusercontent.com/pw/OLD",
      at: Date.now() - 31 * DAY,
    };
    resolveMock.mockResolvedValue("");
    const { urls } = await resolveImageUrls([share(6)]);
    expect(resolveMock).toHaveBeenCalledTimes(1);
    expect(urls.get(share(6))).toBe("https://lh3.googleusercontent.com/pw/OLD");
    expect(stored[key(share(6))].url).toBe(
      "https://lh3.googleusercontent.com/pw/OLD",
    );
    expect(stored[key(share(6))].at).toBeGreaterThan(Date.now() - DAY);
  });

  it("converts Drive links locally, with no cache or network", async () => {
    const drive = "https://drive.google.com/file/d/abcdefghijklmnop/view";
    const { urls } = await resolveImageUrls([drive]);
    expect(urls.get(drive)).toBe(
      "https://lh3.googleusercontent.com/d/abcdefghijklmnop",
    );
    expect(resolveMock).not.toHaveBeenCalled();
  });
});
