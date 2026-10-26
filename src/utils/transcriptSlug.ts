import { logWarn, logError } from "@/lib/devLog";

export interface TranscriptStub {
  slug: string;
  title: string;
  id: number;
  categories: number[];
  baseSlug?: string;
  /** WordPress post date (YYYY-MM-DD…) — matches it to the sermon's date. */
  date?: string;
}

/**
 * Strip a WordPress collision suffix from a slug (e.g. "the-gospel-2" for a
 * re-published "The Gospel") — but keep it when that number actually appears
 * in the title ("Psalm 23", "Part 2", "Acts 2"), where it's meaningful.
 */
export function getBaseSlug(slug: string, transcriptTitle: string): string {
  const match = slug.match(/-(\d+)$/);
  if (!match) return slug;
  if (new RegExp(`\\b${match[1]}\\b`).test(transcriptTitle)) return slug;
  return slug.slice(0, match.index);
}

export async function fetchTranscriptSlugs(): Promise<TranscriptStub[]> {
  try {
    const res = await fetch("/api/transcripts/slugs", {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      logWarn(
        "Failed to fetch transcript slugs",
        { status: res.status },
        { tag: "Transcripts" },
      );
      return [];
    }

    const posts: {
      slug: string;
      title: string;
      id: number;
      categories: number[];
    }[] = await res.json();

    return posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      id: p.id,
      categories: p.categories,
      baseSlug: getBaseSlug(p.slug, p.title),
    }));
  } catch (err) {
    logError("Failed to load transcript data", err, { tag: "Transcripts" });
    return [];
  }
}

// Spelled-out part numbers → digits, so "Part One" matches "Part 1".
const PART_WORD_TO_NUM: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
};
const PART_WORD_RE =
  /\bpart\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g;

export function normalizeTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/&amp;/g, "&")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&ndash;/g, "-")
      .replace(/&mdash;/g, "-")
      .replace(/[\u2018\u2019\u0027]/g, "'")
      .replace(/[\u201C\u201D\u0022]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\bpt\.?\s*/gi, "part ")
      // Spelled-out part numbers → digits: "part one" → "part 1"
      .replace(PART_WORD_RE, (_m, w: string) => `part ${PART_WORD_TO_NUM[w]}`)
      // "Precepts & Lines" must equal "Precepts and Lines"
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function extractPartNumber(normalizedTitle: string): number | null {
  const match = normalizedTitle.match(/\bpart\s*(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
}

export function getCoreTitle(normalizedTitle: string): string {
  return normalizedTitle
    .replace(/\bpart\s*\d+\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "her",
  "was",
  "one",
  "our",
  "out",
  "has",
  "have",
  "had",
  "its",
  "his",
  "how",
  "man",
  "new",
  "now",
  "old",
  "see",
  "way",
  "who",
  "did",
  "get",
  "let",
  "say",
  "she",
  "too",
  "use",
  "with",
  "that",
  "this",
  "will",
  "your",
  "from",
  "they",
  "been",
  "many",
  "some",
  "them",
  "than",
  "each",
  "make",
  "like",
  "into",
  "over",
  "such",
  "what",
  "when",
  "which",
  "their",
  "about",
  "would",
  "there",
  "these",
  "other",
  "could",
  "after",
  "those",
]);

// ── Matching ─────────────────────────────────────────────────────────────────
//
// Titles alone can't tell sermons apart: many are simply "Bible Study" or
// "Opening Charge", and series reuse most of their words ("Creating a
// Blossoming Habitation" vs "Becoming a Blossoming Habitation"). Sermons and
// transcripts both carry the date they were preached — the same day for ~90%
// of real pairs — so the date picks between candidates, and a loose title
// match is only trusted when the dates agree.

const DAY_MS = 24 * 60 * 60 * 1000;
/** A transcript this close to the sermon's date is "the same occasion". */
const SAME_OCCASION_DAYS = 3;
/** Beyond this, an identical title is a different sermon reusing the title
 *  (transcripts are sometimes posted weeks after the sermon). */
const SAME_TITLE_MAX_DAYS = 180;
/** Share of significant words that must agree for a word-overlap match. The
 *  date must also agree, so wording differences like "Godhead"/"Trinity" or
 *  "to"/"till" on the same day still pair up. */
const WORD_OVERLAP_THRESHOLD = 0.6;

/**
 * Service names that recur week after week. A transcript with one of these
 * titles only belongs to a sermon preached on the same occasion.
 */
const GENERIC_TITLES = new Set([
  "bible study",
  "prayer meeting",
  "sunday service",
  "special sunday service",
  "special service",
  "sunday school",
  "opening charge",
  "closing charge",
  "charge",
  "thanksgiving",
  "thanksgiving service",
  "introduction",
  "communion service",
  "question and answers",
  "questions and answers",
  "question answers",
  "vigil",
  "night vigil",
]);

/** Days between two date strings, or null if either is missing/unparseable. */
function daysApart(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const parse = (s: string) => {
    // "2026-09-27" / "2026-09-27T10:00:00" or "September 27, 2026"
    const t = /^\d{4}-\d{2}-\d{2}/.test(s)
      ? Date.parse(`${s.slice(0, 10)}T00:00:00Z`)
      : Date.parse(`${s} UTC`);
    return Number.isNaN(t) ? null : t;
  };
  const ta = parse(a);
  const tb = parse(b);
  if (ta === null || tb === null) return null;
  return Math.abs(Math.round((ta - tb) / DAY_MS));
}

/** Plural-insensitive form: "works" ~ "work", "tribulations" ~ "tribulation". */
function stem(word: string): string {
  return word.length > 4 && word.endsWith("s") && !word.endsWith("ss")
    ? word.slice(0, -1)
    : word;
}

function significantWords(normalized: string): string[] {
  return normalized
    .split(" ")
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .map(stem);
}

/** True when the strings differ by at most one insert/delete/substitute. */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Words count as the same when identical, or — for longer words — one typo
 * apart ("ordinaton" ~ "ordination"). "creating"/"becoming" never pass.
 */
function sameWord(a: string, b: string): boolean {
  return a === b || (a.length >= 6 && b.length >= 6 && withinOneEdit(a, b));
}

/** How many of `a`'s words have a distinct counterpart in `b`. */
function countShared(a: string[], b: string[]): number {
  const pool = [...b];
  let shared = 0;
  for (const w of a) {
    const k = pool.findIndex((u) => sameWord(w, u));
    if (k !== -1) {
      shared++;
      pool.splice(k, 1);
    }
  }
  return shared;
}

interface Candidate {
  t: TranscriptStub;
  days: number | null;
}

/**
 * The closest-dated candidate, provided it is within `maxDays`. With no dates
 * to compare, only a lone candidate is accepted, and only for a non-generic
 * title (`maxDays` > SAME_OCCASION_DAYS).
 */
function pickByDate(
  candidates: Candidate[],
  maxDays: number,
): TranscriptStub | null {
  if (candidates.length === 0) return null;
  const dated = candidates
    .filter((c) => c.days !== null)
    .sort((x, y) => (x.days as number) - (y.days as number));
  if (dated.length > 0) {
    return (dated[0].days as number) <= maxDays ? dated[0].t : null;
  }
  return maxDays > SAME_OCCASION_DAYS && candidates.length === 1
    ? candidates[0].t
    : null;
}

/**
 * The transcript for a sermon, or null when there isn't a confident match.
 *
 * Tiers, strongest first — the first tier with an acceptable candidate wins:
 *   1. Same title (normalised; also ignoring spaces, so "Love Walk" ↔
 *      "Lovewalk"), same part number.
 *   2. Same title ignoring "Part N" formatting, part numbers agreeing.
 *   3. Same significant words in any order, plurals and one-letter typos
 *      tolerated ("SOTS Review Grand Finale" ↔ "SOTS Grand Finale Review",
 *      "Dead Works" ↔ "Dead Work").
 *   4. One title contains the other ("Opening Charge" ↔ "SOTS Day 2:
 *      Opening Charge").
 *   5. ≥60% of significant words agree.
 *
 * Tiers 1–3 take the closest-dated candidate within ~6 months — or within
 * ±3 days for a generic service name ("Bible Study") or one-word title.
 * Tiers 4–5 always need ±3 days, so without dates only an exact, specific
 * title can match.
 *
 * `sermonDate` is the sermon's date ("September 27, 2026" or ISO); stubs
 * carry their WordPress post date.
 */
export function findTranscriptSlug(
  sermonTitle: string,
  transcripts: TranscriptStub[],
  _sermonId?: number,
  sermonDate?: string,
): string | null {
  const normalizedSermon = normalizeTitle(sermonTitle);
  if (!normalizedSermon) return null;

  const sermonPart = extractPartNumber(normalizedSermon);
  const sermonCore = getCoreTitle(normalizedSermon);
  const sermonSquashed = normalizedSermon.replace(/ /g, "");
  const sermonWords = significantWords(normalizedSermon);
  const generic =
    sermonWords.length <= 1 ||
    GENERIC_TITLES.has(sermonCore.replace(/^day \d+ /, ""));
  const titleWindow = generic ? SAME_OCCASION_DAYS : SAME_TITLE_MAX_DAYS;

  const prepared = transcripts.map((t) => {
    const norm = normalizeTitle(t.title);
    return {
      t,
      norm,
      core: getCoreTitle(norm),
      part: extractPartNumber(norm),
      words: significantWords(norm),
      days: daysApart(sermonDate, t.date),
    };
  });
  const partsAgree = (p: { part: number | null }) => p.part === sermonPart;

  // 1. Same title.
  const exact = prepared.filter(
    (p) =>
      p.norm === normalizedSermon ||
      p.norm.replace(/ /g, "") === sermonSquashed,
  );
  let hit = pickByDate(exact, titleWindow);
  if (hit) return hit.slug;

  // 2. Same core title, part numbers agreeing.
  if (sermonCore) {
    hit = pickByDate(
      prepared.filter((p) => p.core === sermonCore && partsAgree(p)),
      titleWindow,
    );
    if (hit) return hit.slug;
  }

  // 3. Same significant words, any order.
  if (sermonWords.length >= 3) {
    hit = pickByDate(
      prepared.filter(
        (p) =>
          partsAgree(p) &&
          p.words.length === sermonWords.length &&
          countShared(sermonWords, p.words) === sermonWords.length,
      ),
      titleWindow,
    );
    if (hit) return hit.slug;
  }

  // 4. One title contains the other — loose, so the same occasion only.
  if (normalizedSermon.length >= 10) {
    hit = pickByDate(
      prepared.filter(
        (p) =>
          p.norm.length >= 10 &&
          partsAgree(p) &&
          (normalizedSermon.includes(p.norm) ||
            p.norm.includes(normalizedSermon)),
      ),
      SAME_OCCASION_DAYS,
    );
    if (hit) return hit.slug;
  }

  // 5. Word overlap — loose, so the same occasion only.
  if (sermonWords.length >= 2) {
    let best: { t: TranscriptStub; score: number; days: number } | null = null;
    for (const p of prepared) {
      if (p.days === null || p.days > SAME_OCCASION_DAYS) continue;
      if (!partsAgree(p) || p.words.length === 0) continue;
      const score =
        countShared(sermonWords, p.words) /
        Math.max(sermonWords.length, p.words.length);
      if (
        score >= WORD_OVERLAP_THRESHOLD &&
        (!best ||
          score > best.score ||
          (score === best.score && p.days < best.days))
      ) {
        best = { t: p.t, score, days: p.days };
      }
    }
    if (best) return best.t.slug;
  }

  return null;
}
