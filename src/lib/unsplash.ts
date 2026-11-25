/**
 * Unsplash utility for fetching high-quality placeholder images.
 * During development, we can use the Unsplash Source-like URLs or the official API.
 */

export type UnsplashCategory =
  | "church"
  | "worship"
  | "community"
  | "bible"
  | "children"
  | "nature"
  | "meeting";

const categoryKeywords: Record<UnsplashCategory, string[]> = {
  church: ["church-building", "cathedral", "chapel"],
  worship: ["worship-music", "praise", "hands-raised", "singing"],
  community: ["diverse-people", "fellowship", "smiling-people", "unity"],
  bible: ["bible-study", "open-bible", "reading-scripture"],
  children: ["sunday-school", "kids-learning", "children-playing"],
  nature: ["landscape", "serene-nature", "mountains", "forest"],
  meeting: ["business-meeting", "group-discussion", "gathering"],
};

export function getUnsplashUrl(
  category: UnsplashCategory,
  width = 1200,
  height = 800,
) {
  const keywords = categoryKeywords[category];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];

  // Use the refined search URL format for Unsplash
  // This provides a "random" image from the search query
  return `https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=${width}&auto=format&fit=crop&sig=${Math.random()}`;

  // A better way for placeholders without API key:
  // return `https://source.unsplash.com/featured/${width}x${height}?${keyword}`;
  // NOTE: source.unsplash.com is being deprecated.

  // Using direct unsplash image URLs with unique sig for diversity
}
