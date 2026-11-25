/**
 * Matching a sermon title (e.g. a quiz question's sermon_ref, which is the
 * transcript slug, i.e. the audio message's title) to the audio message with
 * that title.
 *
 * Exact after normalising (case, punctuation, apostrophes, "Part 2" vs
 * "Pt. 2" vs "(Part 2)"), and the part numbers must agree: "Pt. 2" never
 * matches Part 1, and a title without a part only matches Part 1 or an
 * unnumbered title. Small spelling drift ("Awaking"/"Awakening",
 * "an"/"a") is accepted when nearly all words agree. Otherwise there is no
 * match, never "the first search result" (which recommended the wrong message).
 */
import { parseSermonPart } from "./sermonParts";

export interface TitleKey {
  /** Normalised title without the part marker. */
  base: string;
  /** Part number; null when the title has none. */
  part: number | null;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&#8217;": "'",
  "&#8216;": "'",
  "&#039;": "'",
  "&#39;": "'",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&#8211;": "-",
  "&#8212;": "-",
  "&ndash;": "-",
  "&mdash;": "-",
  "&quot;": '"',
  "&#8220;": '"',
  "&#8221;": '"',
};

/** Plain text of a WordPress title (strips tags and the common entities). */
export function plainTitle(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/&[#a-z0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .trim();
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’‘`´]/g, "") // God`s / God's → gods
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Title → { base, part }. */
export function titleKey(title: string): TitleKey {
  const text = plainTitle(title);
  const parsed = parseSermonPart(text);
  return parsed ? { base: normalise(parsed.baseTitle), part: parsed.part } : { base: normalise(text), part: null };
}

/**
 * A transcript slug as a title. WordPress appends "-2", "-3"… to a slug that's
 * already taken (the next part of a series), so a trailing number becomes the
 * part when the slug has no explicit "pt"/"part".
 */
export function titleFromSlug(slug: string): string {
  const words = slug.replace(/[-_]+/g, " ").trim();
  const explicit = parseSermonPart(words);
  if (explicit) return words;
  const m = /^(.*\S)\s+(\d{1,2})$/.exec(words);
  return m ? `${m[1]} Pt. ${m[2]}` : words;
}

/** Light stemming so plurals don't count as different words. */
function stem(word: string): string {
  return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
}

/** Dice similarity of the two bases' word sets (0..1). */
export function wordSimilarity(a: string, b: string): number {
  const wa = new Set(a.split(" ").filter(Boolean).map(stem));
  const wb = new Set(b.split(" ").filter(Boolean).map(stem));
  if (!wa.size || !wb.size) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return (2 * common) / (wa.size + wb.size);
}

const samePart = (a: number | null, b: number | null) => (a ?? 1) === (b ?? 1);

const MINOR_WORDS = new Set("a an the of in on at to for and or by with from as".split(" "));

/**
 * The audio title is a shortened form of the target: every meaningful word of
 * it appears in the target (e.g. "Recap of The Believers Life of Prayer" for
 * "Recap: Pray Ye the Lord of Harvest; The Believers' Life of Prayer").
 * Needs at least four such words so short generic titles don't qualify.
 */
function isShortenedForm(target: string, candidate: string): boolean {
  const t = new Set(target.split(" ").map(stem));
  const words = candidate.split(" ").filter((w) => w && !MINOR_WORDS.has(w)).map(stem);
  return words.length >= 4 && words.every((w) => t.has(w));
}

/** Minimum word similarity for a near-match (exact base always wins). */
export const NEAR_MATCH = 0.8;

export function matchSermonTitle<T extends { title: string }>(target: string, candidates: readonly T[]): T | null {
  const want = titleKey(target);
  if (!want.base) return null;
  let best: { item: T; score: number } | null = null;
  for (const item of candidates) {
    const have = titleKey(item.title);
    if (!samePart(want.part, have.part)) continue;
    const score =
      have.base === want.base
        ? 1
        : Math.max(wordSimilarity(want.base, have.base), isShortenedForm(want.base, have.base) ? NEAR_MATCH : 0);
    if (score >= NEAR_MATCH && (!best || score > best.score)) best = { item, score };
  }
  return best?.item ?? null;
}
