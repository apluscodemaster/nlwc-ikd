import { describe, it, expect, vi, afterEach } from "vitest";
import {
  cleanVerseText,
  parseVerseId,
  isCanonicalBook,
  normalizeApiBibleResults,
  CANONICAL_BOOKS,
} from "@/lib/bibleApi";
import { searchBible, initBibleSearch } from "@/lib/bibleSearch";

// =============================================================================
// cleanVerseText
// =============================================================================
describe("cleanVerseText", () => {
  it("strips HTML tags", () => {
    expect(
      cleanVerseText('<p class="p"><span class="v">16</span>For God</p>'),
    ).toBe("16 For God");
  });

  it("removes paragraph markers and collapses whitespace", () => {
    expect(cleanVerseText("¶ For God  so   loved")).toBe("For God so loved");
  });

  it("trims surrounding whitespace", () => {
    expect(cleanVerseText("  hello world  ")).toBe("hello world");
  });

  it("preserves curly apostrophes from the API text", () => {
    expect(cleanVerseText("Kish  Saul’s father")).toBe(
      "Kish Saul’s father",
    );
  });
});

// =============================================================================
// parseVerseId
// =============================================================================
describe("parseVerseId", () => {
  it("parses BOOK.CHAPTER.VERSE", () => {
    expect(parseVerseId("1SA.9.3")).toEqual({
      book: "1SA",
      chapter: 9,
      verse: 3,
    });
  });

  it("parses three-letter book codes", () => {
    expect(parseVerseId("JHN.3.16")).toEqual({
      book: "JHN",
      chapter: 3,
      verse: 16,
    });
  });

  it("defaults missing chapter/verse to 0", () => {
    expect(parseVerseId("GEN")).toEqual({ book: "GEN", chapter: 0, verse: 0 });
  });
});

// =============================================================================
// isCanonicalBook / CANONICAL_BOOKS
// =============================================================================
describe("isCanonicalBook", () => {
  it("accepts canonical Old and New Testament books", () => {
    expect(isCanonicalBook("GEN")).toBe(true);
    expect(isCanonicalBook("MAL")).toBe(true);
    expect(isCanonicalBook("JHN")).toBe(true);
    expect(isCanonicalBook("REV")).toBe(true);
    expect(isCanonicalBook("3JN")).toBe(true);
  });

  it("rejects every apocryphal book code", () => {
    const apocrypha = [
      "1ES", "2ES", "TOB", "JDT", "ESG", "WIS",
      "SIR", "BAR", "S3Y", "SUS", "BEL", "MAN", "1MA", "2MA",
    ];
    for (const code of apocrypha) {
      expect(isCanonicalBook(code)).toBe(false);
    }
  });

  it("contains exactly 66 books", () => {
    expect(CANONICAL_BOOKS.size).toBe(66);
  });
});

// =============================================================================
// normalizeApiBibleResults
// =============================================================================
describe("normalizeApiBibleResults", () => {
  it("maps keyword verses into SearchResults", () => {
    const data = {
      verses: [
        {
          id: "1SA.9.3",
          reference: "1 Samuel 9:3",
          text: "And the asses of Kish  Saul’s father were lost.",
        },
      ],
    };
    expect(normalizeApiBibleResults(data, 20)).toEqual([
      {
        id: "1SA.9.3",
        book: "1SA",
        chapter: 9,
        verse: 3,
        ref: "1 Samuel 9:3",
        text: "And the asses of Kish Saul’s father were lost.",
      },
    ]);
  });

  it("drops apocryphal verses but keeps canonical ones", () => {
    const data = {
      verses: [
        { id: "WIS.7.7", reference: "Wisdom 7:7", text: "Wherefore I prayed" },
        {
          id: "PRO.4.7",
          reference: "Proverbs 4:7",
          text: "Wisdom is the principal thing",
        },
        { id: "SIR.1.1", reference: "Sirach 1:1", text: "All wisdom" },
        { id: "BAR.3.9", reference: "Baruch 3:9", text: "Hear, Israel" },
      ],
    };
    expect(normalizeApiBibleResults(data, 20).map((r) => r.book)).toEqual([
      "PRO",
    ]);
  });

  it("caps results at max", () => {
    const verses = Array.from({ length: 30 }, (_, i) => ({
      id: `PSA.1.${i + 1}`,
      reference: `Psalm 1:${i + 1}`,
      text: `verse ${i + 1}`,
    }));
    expect(normalizeApiBibleResults({ verses }, 20)).toHaveLength(20);
  });

  it("falls back to passages for a reference query and strips the leading verse number", () => {
    const data = {
      passages: [
        {
          id: "JHN.3.16",
          reference: "John 3:16",
          content:
            '<p class="p"><span data-number="16" class="v">16</span>' +
            '<span class="wj">¶ For God so loved the world.</span></p>',
        },
      ],
    };
    expect(normalizeApiBibleResults(data, 20)).toEqual([
      {
        id: "JHN.3.16",
        book: "JHN",
        chapter: 3,
        verse: 16,
        ref: "John 3:16",
        text: "For God so loved the world.",
      },
    ]);
  });

  it("prefers verses over passages when both are present", () => {
    const data = {
      verses: [{ id: "GEN.1.1", reference: "Genesis 1:1", text: "In the beginning" }],
      passages: [{ id: "JHN.3.16", reference: "John 3:16", content: "<p>16 x</p>" }],
    };
    expect(normalizeApiBibleResults(data, 20).map((r) => r.id)).toEqual([
      "GEN.1.1",
    ]);
  });

  it("ignores entries missing an id or text", () => {
    const data = {
      verses: [
        { id: "", reference: "x", text: "no id" },
        { id: "GEN.1.1", reference: "Genesis 1:1", text: "" },
        { id: "GEN.1.2", reference: "Genesis 1:2", text: "And the earth" },
      ],
    };
    expect(normalizeApiBibleResults(data, 20).map((r) => r.id)).toEqual([
      "GEN.1.2",
    ]);
  });

  it("returns an empty array for an empty payload", () => {
    expect(normalizeApiBibleResults({}, 20)).toEqual([]);
  });
});

// =============================================================================
// searchBible (client) — talks to the /api/bible/search proxy
// =============================================================================
describe("searchBible", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns [] for queries under 2 characters without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await searchBible("a")).toEqual([]);
    expect(await searchBible("  ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the proxy with an encoded query and returns the results", async () => {
    const results = [
      { id: "JHN.3.16", book: "JHN", chapter: 3, verse: 16, text: "For God", ref: "John 3:16" },
    ];
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ results }) });
    vi.stubGlobal("fetch", fetchMock);

    const out = await searchBible("John 3:16");

    expect(fetchMock).toHaveBeenCalledWith("/api/bible/search?q=John%203%3A16", {
      signal: undefined,
    });
    expect(out).toEqual(results);
  });

  it("forwards the abort signal", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await searchBible("grace", controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("q=grace"), {
      signal: controller.signal,
    });
  });

  it("throws when the proxy responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );
    await expect(searchBible("love")).rejects.toThrow("Search failed: 502");
  });

  it("returns [] when the payload has no results array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    expect(await searchBible("mercy")).toEqual([]);
  });
});

describe("initBibleSearch", () => {
  it("resolves without error (no-op preload for the API-backed search)", async () => {
    await expect(initBibleSearch()).resolves.toBeUndefined();
  });
});
