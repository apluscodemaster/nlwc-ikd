import { describe, it, expect } from "vitest";
import {
  toDateInputValue,
  todayInputValue,
  stripLeadingSpeakerLine,
  withSpeakerLine,
} from "@/components/admin/content/contentHelpers";

describe("toDateInputValue", () => {
  it("returns '' for empty input", () => {
    expect(toDateInputValue()).toBe("");
    expect(toDateInputValue("")).toBe("");
  });

  it("takes the calendar day of a naive WP timestamp literally", () => {
    // Must not be re-interpreted in the browser zone and shift a day.
    expect(toDateInputValue("2026-07-28T00:15:00")).toBe("2026-07-28");
  });

  it("parses a formatted label using local calendar parts", () => {
    expect(toDateInputValue("January 5, 2025")).toBe("2025-01-05");
  });

  it("returns '' for garbage", () => {
    expect(toDateInputValue("not a date")).toBe("");
  });
});

describe("todayInputValue", () => {
  it("formats local calendar parts zero-padded", () => {
    expect(todayInputValue(new Date(2026, 2, 7))).toBe("2026-03-07");
  });
});

describe("stripLeadingSpeakerLine", () => {
  it("removes a leading <p><strong>Minister:</strong> …</p> paragraph", () => {
    const html =
      "<p><strong>Minister:</strong> Pst. A</p>\n<p>Body stays.</p>";
    expect(stripLeadingSpeakerLine(html)).toBe("<p>Body stays.</p>");
  });

  it("removes a leading bare 'Minister: …' line (manuals)", () => {
    expect(stripLeadingSpeakerLine("Minister: Pst. A\nLesson 1")).toBe(
      "Lesson 1",
    );
  });

  it("accepts 'Speaker:' as the label", () => {
    expect(stripLeadingSpeakerLine("<p>Speaker: X</p><p>Y</p>")).toBe(
      "<p>Y</p>",
    );
  });

  it("never touches a Minister line that is not the first node", () => {
    const html = "<p>Intro</p><p><strong>Minister:</strong> Pst. A</p>";
    expect(stripLeadingSpeakerLine(html)).toBe(html);
  });

  it("only removes the first paragraph even when others follow", () => {
    const html =
      "<p><strong>Minister:</strong> A</p><p><strong>Minister:</strong> B</p>";
    expect(stripLeadingSpeakerLine(html)).toBe(
      "<p><strong>Minister:</strong> B</p>",
    );
  });
});

describe("withSpeakerLine", () => {
  it("prepends a paragraph for transcripts", () => {
    expect(withSpeakerLine("<p>Body</p>", "Pst. A", "transcript")).toBe(
      "<p><strong>Minister:</strong> Pst. A</p>\n<p>Body</p>",
    );
  });

  it("prepends a bare line for manuals", () => {
    expect(withSpeakerLine("Body", "Pst. A", "manual")).toBe(
      "Minister: Pst. A\nBody",
    );
  });

  it("replaces an existing leading line rather than stacking", () => {
    const html = "<p><strong>Minister:</strong> Old</p><p>Body</p>";
    expect(withSpeakerLine(html, "New", "transcript")).toBe(
      "<p><strong>Minister:</strong> New</p>\n<p>Body</p>",
    );
  });

  it("just strips when no speaker is selected", () => {
    expect(withSpeakerLine("Minister: Old\nBody", "", "manual")).toBe("Body");
  });
});
