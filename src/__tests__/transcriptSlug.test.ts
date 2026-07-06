import { describe, it, expect } from "vitest";
import {
  getBaseSlug,
  normalizeTitle,
  extractPartNumber,
  getCoreTitle,
  findTranscriptSlug,
  type TranscriptStub,
} from "@/utils/transcriptSlug";

// =============================================================================
// getBaseSlug
// =============================================================================
describe("getBaseSlug", () => {
  it("strips numeric suffix from a slug without part reference in title", () => {
    expect(getBaseSlug("the-gospel-of-christ-2", "The Gospel of Christ")).toBe(
      "the-gospel-of-christ",
    );
  });

  it("strips any trailing number suffix", () => {
    expect(getBaseSlug("living-by-faith-3", "Living by Faith")).toBe(
      "living-by-faith",
    );
  });

  it("keeps full slug when title contains 'Part 2'", () => {
    expect(getBaseSlug("the-love-of-god-2", "The Love of God Part 2")).toBe(
      "the-love-of-god-2",
    );
  });

  it("keeps full slug when title contains 'Pt. 3'", () => {
    expect(getBaseSlug("grace-and-mercy-3", "Grace and Mercy Pt. 3")).toBe(
      "grace-and-mercy-3",
    );
  });

  it("keeps full slug when title contains 'pt 1' (lowercase)", () => {
    expect(getBaseSlug("healing-power-1", "Healing Power pt 1")).toBe(
      "healing-power-1",
    );
  });

  it("returns slug unchanged when no numeric suffix exists", () => {
    expect(getBaseSlug("the-gospel-of-christ", "The Gospel of Christ")).toBe(
      "the-gospel-of-christ",
    );
  });
});

// =============================================================================
// normalizeTitle
// =============================================================================
describe("normalizeTitle", () => {
  it("lowercases and trims", () => {
    expect(normalizeTitle("  Hello World  ")).toBe("hello world");
  });

  it("decodes HTML entities", () => {
    expect(normalizeTitle("God&#8217;s Grace")).toBe("gods grace");
  });

  it("decodes &amp; entity", () => {
    expect(normalizeTitle("Love &amp; Faith")).toBe("love faith");
  });

  it("normalizes 'Pt.' to 'part'", () => {
    expect(normalizeTitle("Healing Pt. 2")).toBe("healing part 2");
  });

  it("normalizes 'PT' (uppercase) to 'part'", () => {
    expect(normalizeTitle("Healing PT 3")).toBe("healing part 3");
  });

  it("normalizes unicode smart quotes", () => {
    expect(normalizeTitle("The \u201CWord\u201D")).toBe("the word");
  });

  it("normalizes en-dash and em-dash to hyphen then strips", () => {
    expect(normalizeTitle("Faith\u2013Hope")).toBe("faithhope");
  });

  it("removes non-alphanumeric chars", () => {
    expect(normalizeTitle("Hello! @World #2")).toBe("hello world 2");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeTitle("The   Love   of   God")).toBe("the love of god");
  });
});

// =============================================================================
// extractPartNumber
// =============================================================================
describe("extractPartNumber", () => {
  it("extracts part number from normalized title", () => {
    expect(extractPartNumber("the love of god part 2")).toBe(2);
  });

  it("extracts part 1", () => {
    expect(extractPartNumber("healing part 1")).toBe(1);
  });

  it("returns null when no part number exists", () => {
    expect(extractPartNumber("the gospel of christ")).toBeNull();
  });

  it("extracts larger part numbers", () => {
    expect(extractPartNumber("series on faith part 12")).toBe(12);
  });
});

// =============================================================================
// getCoreTitle
// =============================================================================
describe("getCoreTitle", () => {
  it("strips part indicator from title", () => {
    expect(getCoreTitle("the love of god part 2")).toBe("the love of god");
  });

  it("returns title unchanged when no part indicator", () => {
    expect(getCoreTitle("the gospel of christ")).toBe("the gospel of christ");
  });

  it("strips multiple part indicators", () => {
    expect(getCoreTitle("faith part 1 and hope part 2")).toBe("faith and hope");
  });

  it("trims whitespace after stripping", () => {
    expect(getCoreTitle("healing part 3")).toBe("healing");
  });
});

// =============================================================================
// findTranscriptSlug
// =============================================================================
describe("findTranscriptSlug", () => {
  const transcripts: TranscriptStub[] = [
    {
      slug: "the-gospel-of-christ",
      title: "The Gospel of Christ",
      id: 1,
      categories: [20],
      baseSlug: "the-gospel-of-christ",
    },
    {
      slug: "the-love-of-god",
      title: "The Love of God",
      id: 2,
      categories: [20],
      baseSlug: "the-love-of-god",
    },
    {
      slug: "healing-power-part-1",
      title: "Healing Power Part 1",
      id: 3,
      categories: [20],
      baseSlug: "healing-power-part-1",
    },
    {
      slug: "healing-power-part-2",
      title: "Healing Power Part 2",
      id: 4,
      categories: [20],
      baseSlug: "healing-power-part-2",
    },
    {
      slug: "the-love-of-god-2",
      title: "The Love of God",
      id: 5,
      categories: [20],
      baseSlug: "the-love-of-god",
    },
    {
      slug: "walking-in-divine-grace-and-favor",
      title: "Walking in Divine Grace and Favor",
      id: 6,
      categories: [20],
      baseSlug: "walking-in-divine-grace-and-favor",
    },
  ];

  // 1. Exact match
  it("matches exact title", () => {
    expect(findTranscriptSlug("The Gospel of Christ", transcripts)).toBe(
      "the-gospel-of-christ",
    );
  });

  it("matches title with different casing", () => {
    expect(findTranscriptSlug("THE GOSPEL OF CHRIST", transcripts)).toBe(
      "the-gospel-of-christ",
    );
  });

  // 2. Part number matching
  it("matches sermon with Part 2 to transcript with Part 2", () => {
    expect(findTranscriptSlug("Healing Power Part 2", transcripts)).toBe(
      "healing-power-part-2",
    );
  });

  it("matches sermon with Pt. 1 to transcript with Part 1", () => {
    expect(findTranscriptSlug("Healing Power Pt. 1", transcripts)).toBe(
      "healing-power-part-1",
    );
  });

  it("does not match Part 1 to Part 2", () => {
    // "Healing Power Part 1" should match part 1, not part 2
    const result = findTranscriptSlug("Healing Power Part 1", transcripts);
    expect(result).toBe("healing-power-part-1");
  });

  // 3. Sermon without part number matches transcript without part number
  it("matches sermon without part to transcript without part", () => {
    expect(findTranscriptSlug("The Love of God", transcripts)).toBe(
      "the-love-of-god",
    );
  });

  // 4. Substring containment
  it("matches by substring containment", () => {
    expect(
      findTranscriptSlug(
        "Walking in Divine Grace and Favor - Sunday Service",
        transcripts,
      ),
    ).toBe("walking-in-divine-grace-and-favor");
  });

  // 5. Word overlap
  it("matches by word overlap when above threshold", () => {
    expect(
      findTranscriptSlug("Divine Grace and Favor Walking", transcripts),
    ).toBe("walking-in-divine-grace-and-favor");
  });

  // 6. No match
  it("returns null when no match found", () => {
    expect(
      findTranscriptSlug("Totally Unrelated Title", transcripts),
    ).toBeNull();
  });

  it("returns null for empty title", () => {
    expect(findTranscriptSlug("", transcripts)).toBeNull();
  });

  // 7. HTML entity handling in matching
  it("matches despite HTML entities in transcript title", () => {
    const withEntities: TranscriptStub[] = [
      {
        slug: "gods-grace",
        title: "God&#8217;s Grace",
        id: 10,
        categories: [20],
        baseSlug: "gods-grace",
      },
    ];
    expect(findTranscriptSlug("God's Grace", withEntities)).toBe("gods-grace");
  });

  // 8. Returns the real, resolvable slug — never the collision-stripped base.
  //    A "-2" suffix means another post (often a same-title manual) owns the
  //    base slug, so navigating to the base would resolve to the wrong content.
  it("returns the transcript's real slug, not the stripped base slug", () => {
    const stubs: TranscriptStub[] = [
      {
        slug: "grace-message-2",
        title: "Grace Message",
        id: 20,
        categories: [20],
        baseSlug: "grace-message",
      },
    ];
    expect(findTranscriptSlug("Grace Message", stubs)).toBe("grace-message-2");
  });

  // 9. Falls back to slug when no baseSlug
  it("returns slug when baseSlug is undefined", () => {
    const stubs: TranscriptStub[] = [
      {
        slug: "grace-message",
        title: "Grace Message",
        id: 20,
        categories: [20],
      },
    ];
    expect(findTranscriptSlug("Grace Message", stubs)).toBe("grace-message");
  });
});
