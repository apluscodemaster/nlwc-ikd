import { describe, it, expect } from "vitest";
import { findTranscriptSlug, type TranscriptStub } from "@/utils/transcriptSlug";

// Real titles from 26–27 Sep 2026. The transcripts are filed under "Family
// Life Festival", a category created from the admin; they went unmatched
// because the matcher's transcript list only covered the original five
// categories (fixed in /api/wp/transcript-slugs).
const FAMILY_LIFE_FESTIVAL = 36;
const transcripts: TranscriptStub[] = [
  "Heart Preparation Towards Raising a Blossoming Habitation|heart-preparation-towards-raising-a-blossoming-habitation",
  "Keeping the Laws of Life in Making a Blossoming Habitation|keeping-the-laws-of-life-in-making-a-blossoming-habitation",
  "Recovery of the Man after the Ordination of God|recovery-of-the-man-after-the-ordination-of-god",
  "God Setting Solitary in Families for the Healing of the World|god-setting-solitary-in-families-for-the-healing-of-the-world",
].map((row, i) => {
  const [title, slug] = row.split("|");
  return { title, slug, id: i + 1, categories: [FAMILY_LIFE_FESTIVAL] };
});

describe("matching Family Life Weekend sermons to their transcripts", () => {
  it.each([
    [
      "Heart Preparation towards Raising a Blossoming Habitation",
      "heart-preparation-towards-raising-a-blossoming-habitation",
    ],
    [
      "Keeping the Laws of Life in Making a Blossoming Habitation",
      "keeping-the-laws-of-life-in-making-a-blossoming-habitation",
    ],
    // Sermon title has a typo ("Ordinaton") and a leading space.
    [
      " Recovery of the Man after the Ordinaton of God",
      "recovery-of-the-man-after-the-ordination-of-god",
    ],
    [
      " God Setting Solitary in Families for the Healing of the World",
      "god-setting-solitary-in-families-for-the-healing-of-the-world",
    ],
  ])("matches %j", (sermonTitle, slug) => {
    expect(findTranscriptSlug(sermonTitle, transcripts)).toBe(slug);
  });

  it("leaves sermons without a transcript unmatched", () => {
    expect(
      findTranscriptSlug("Expressing the Woman in God`s Heart", transcripts),
    ).toBeNull();
  });
});
