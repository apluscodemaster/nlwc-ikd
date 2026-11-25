import { describe, expect, it } from "vitest";
import { matchSermonTitle, titleFromSlug, titleKey } from "@/lib/sermonMatch";

const audio = (titles: string[]) => titles.map((title, i) => ({ id: i + 1, title }));

describe("matching a sermon title to its audio message", () => {
  it("treats Part/Pt./(Part N) alike and reads WordPress's -2 slug suffix as the part", () => {
    expect(titleKey("Understanding Precepts and Lines (Part 2)")).toEqual({ base: "understanding precepts and lines", part: 2 });
    expect(titleKey("Faith Pt. 2")).toEqual(titleKey("Faith Part 2"));
    expect(titleFromSlug("directional-growth-of-man-2")).toBe("directional growth of man Pt. 2");
    expect(titleFromSlug("what-does-it-really-mean-to-grow-spiritually-pt-2")).toBe(
      "what does it really mean to grow spiritually pt 2",
    );
  });

  it("never matches a different part (the old bug)", () => {
    const list = audio(["What Does it Really Mean to Grow Spiritually", "The Essence of Discipleship Pt. 3"]);
    expect(matchSermonTitle("What Does it Really Mean to Grow Spiritually Pt. 2", list)).toBeNull();
    expect(matchSermonTitle("The Essence of Discipleship", list)).toBeNull();
    expect(
      matchSermonTitle("What Does it Really Mean to Grow Spiritually Pt. 2", [
        ...list,
        { id: 9, title: "What Does It Really Mean To Grow Spiritually (Part 2)" },
      ])?.id,
    ).toBe(9);
  });

  it("accepts small spelling drift and punctuation, and shortened recap titles", () => {
    const list = audio([
      "Awaking from Sleep by the Opening of our Eyes of Understanding",
      "God`s Intent for Raising a Godly Woman",
      "Recap of The Believers Life of Prayer",
    ]);
    expect(matchSermonTitle("Awakening from Sleep by the Opening of our Eyes of Understanding", list)?.id).toBe(1);
    expect(matchSermonTitle("God&#8217;s Intent for Raising a Godly Woman", list)?.id).toBe(2);
    expect(matchSermonTitle("recap pray ye the lord of harvest the believers life of prayer", list)?.id).toBe(3);
    // The main sermon isn't the recap.
    expect(matchSermonTitle("Pray Ye the Lord of the Harvest; The Believers’ Life of Prayer", list)).toBeNull();
  });

  it("returns nothing rather than an unrelated first search result", () => {
    const list = audio(["Overcoming Sin by the Law of the Spirit of Life in Christ", "Prayer of Faith"]);
    expect(matchSermonTitle("Overcoming Evil with Good", list)).toBeNull();
  });
});
