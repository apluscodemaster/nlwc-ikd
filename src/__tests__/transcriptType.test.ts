import { describe, it, expect } from "vitest";
import {
  resolveTranscriptType,
  transformToTranscriptListing,
  WP_CATEGORIES,
  type WPPost,
} from "@/lib/wordpress";

/** Minimal WPPost carrying just the fields the type resolution reads. */
function postInCategories(categories: number[]): WPPost {
  return {
    id: 1,
    date: "2026-06-21T12:00:00",
    date_gmt: "2026-06-21T12:00:00",
    modified: "2026-06-21T12:00:00",
    modified_gmt: "2026-06-21T12:00:00",
    slug: "a-transcript",
    status: "publish",
    type: "post",
    link: "https://ikorodu.nlwc.church/a-transcript/",
    title: { rendered: "A Transcript" },
    content: { rendered: "<p>Body</p>", protected: false },
    excerpt: { rendered: "<p>Excerpt</p>", protected: false },
    author: 2,
    featured_media: 0,
    categories,
    tags: [],
  };
}

describe("resolveTranscriptType", () => {
  it("maps every transcript category to its own type", () => {
    const cases: Array<[number, string]> = [
      [WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS, "sunday-message"],
      [WP_CATEGORIES.SUNDAY_SCHOOL_TRANSCRIPTS, "sunday-school"],
      [WP_CATEGORIES.BIBLE_STUDY_TRANSCRIPTS, "bible-study"],
      [WP_CATEGORIES.OTHER_MEETINGS, "other-meetings"],
      [WP_CATEGORIES.SEASON_OF_THE_SPIRIT, "season-of-the-spirit"],
    ];
    for (const [categoryId, expected] of cases) {
      expect(resolveTranscriptType(postInCategories([categoryId]))).toBe(
        expected,
      );
    }
  });

  // The regression this guards: Bible Study, Other Meetings and Season of the
  // Spirit all used to collapse to "sunday-message", which the admin edit form
  // then wrote back as category 20 on save — silently re-filing the post.
  it("does not report non-Sunday-School transcripts as Sunday Message", () => {
    for (const categoryId of [
      WP_CATEGORIES.BIBLE_STUDY_TRANSCRIPTS,
      WP_CATEGORIES.OTHER_MEETINGS,
      WP_CATEGORIES.SEASON_OF_THE_SPIRIT,
    ]) {
      expect(resolveTranscriptType(postInCategories([categoryId]))).not.toBe(
        "sunday-message",
      );
    }
  });

  it("ignores unrelated categories alongside the transcript one", () => {
    const post = postInCategories([
      WP_CATEGORIES.POST,
      WP_CATEGORIES.BIBLE_STUDY_TRANSCRIPTS,
    ]);
    expect(resolveTranscriptType(post)).toBe("bible-study");
  });

  it("picks the first match in priority order for a multi-filed post", () => {
    const post = postInCategories([
      WP_CATEGORIES.OTHER_MEETINGS,
      WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS,
    ]);
    expect(resolveTranscriptType(post)).toBe("sunday-message");
  });

  it("falls back to sunday-message when no transcript category is present", () => {
    expect(resolveTranscriptType(postInCategories([WP_CATEGORIES.POST]))).toBe(
      "sunday-message",
    );
    expect(resolveTranscriptType(postInCategories([]))).toBe("sunday-message");
  });

  it("carries the resolved type through the listing transform", () => {
    const post = postInCategories([WP_CATEGORIES.SEASON_OF_THE_SPIRIT]);
    expect(transformToTranscriptListing(post).type).toBe(
      "season-of-the-spirit",
    );
  });
});
