import { describe, it, expect } from "vitest";
import { findTranscriptSlug, type TranscriptStub } from "@/utils/transcriptSlug";

// Real titles and dates from the sermon catalogue / WordPress (Oct 2026).
let nextId = 1;
const t = (title: string, slug: string, date: string): TranscriptStub => ({
  title,
  slug,
  date,
  id: nextId++,
  categories: [],
});

const transcripts: TranscriptStub[] = [
  t("Becoming a Blossoming Habitation", "becoming-a-blossoming-habitation", "2026-09-20T10:00:00"),
  t("Bible Study", "bible-study", "2026-07-17T18:00:00"),
  t("Bible Study", "bible-study-2", "2026-08-21T18:00:00"),
  t("SOTS Day 2: Opening Charge", "sots-day-2-opening-charge", "2025-02-09T08:00:00"),
  t("DOING THE WORK OF FAITH", "doing-the-work-of-faith", "2021-01-24T08:00:00"),
  t("Lovewalk Unto Eternal Life", "lovewalk-unto-eternal-life", "2025-02-02T08:00:00"),
  t("What are Precepts &amp; Lines?", "5841-2", "2024-07-18T08:00:00"),
  t("SOTS Grand Finale Review", "sots-grand-finale-review", "2024-07-18T08:00:00"),
  t("Doctrine of Baptisms (Part 2)", "doctrine-of-baptisms-part-2", "2025-02-16T08:00:00"),
  t("Fighting the Good Fight of Faith", "fighting-the-good-fight-of-faith", "2026-07-12T08:00:00"),
  t("Continuing In Prayer (Part 2)", "continuing-in-prayer-part-2", "2021-10-19T08:00:00"),
];

const match = (title: string, date: string) =>
  findTranscriptSlug(title, transcripts, undefined, date);

describe("transcript matching uses the sermon date", () => {
  it("doesn't pair a sermon with a sibling title from another week", () => {
    // The reported bug: shared words "blossoming habitation", 14 days apart.
    expect(match("Creating a Blossoming Habitation", "September 6, 2026")).toBeNull();
    expect(match(" Becoming a Blossoming Habitation ", "September 20, 2026")).toBe(
      "becoming-a-blossoming-habitation",
    );
  });

  it("pairs generic titles only with the same occasion", () => {
    expect(match("Bible Study", "August 21, 2026")).toBe("bible-study-2");
    expect(match("BIBLE STUDY", "July 17, 2026")).toBe("bible-study");
    // A Bible Study a week later has no transcript of its own.
    expect(match("Bible Study", "July 24, 2026")).toBeNull();
    expect(match("Opening Charge", "February 9, 2025")).toBe(
      "sots-day-2-opening-charge",
    );
    expect(match("Opening Charge", "February 2, 2025")).toBeNull();
  });

  it("tolerates plurals, '&', joined words and reordering", () => {
    expect(match("Doing the Works of Faith", "January 24, 2021")).toBe(
      "doing-the-work-of-faith",
    );
    expect(match("Love Walk Unto Eternal Life", "February 2, 2025")).toBe(
      "lovewalk-unto-eternal-life",
    );
    // Transcripts posted ~10 weeks after the sermon still pair on title.
    expect(match("What are Precepts and Lines", "May 5, 2024")).toBe("5841-2");
    expect(match("SOTS Review Grand Finale", "May 5, 2024")).toBe(
      "sots-grand-finale-review",
    );
  });

  it("keeps part numbers strict", () => {
    expect(match("Doctrine of Baptisms Pt 2", "February 8, 2025")).toBe(
      "doctrine-of-baptisms-part-2",
    );
    expect(match("Doctrine Of Baptisms", "January 11, 2025")).toBeNull();
    // Different title, 2.5 years apart.
    expect(match("Understanding Prayer pt 2", "April 3, 2024")).toBeNull();
  });

  it("treats a title reused years later as a different sermon", () => {
    expect(match("Fighting the good fight of Faith", "April 25, 2021")).toBeNull();
    expect(match("Fighting the Good Fight of Faith", "July 12, 2026")).toBe(
      "fighting-the-good-fight-of-faith",
    );
  });

  it("without dates, only matches an exact, specific title", () => {
    expect(findTranscriptSlug("Fighting the Good Fight of Faith", transcripts)).toBe(
      "fighting-the-good-fight-of-faith",
    );
    expect(findTranscriptSlug("Bible Study", transcripts)).toBeNull();
    expect(findTranscriptSlug("Creating a Blossoming Habitation", transcripts)).toBeNull();
  });
});
