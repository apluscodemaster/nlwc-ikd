/**
 * Sermon "Part" detection & sibling matching.
 *
 * Messages are often split into parts whose only marker is in the title
 * ("The Power Of Faith — Pt. 2"). There is no `part` field on the WordPress /
 * Series Engine record, so parts are derived from the title.
 *
 * This module is deliberately CONSERVATIVE and purely additive:
 * `parseSermonPart()` returns `null` for any title without an explicit
 * "Pt"/"Part" keyword followed by a resolvable number. Callers therefore get
 * `null` for ordinary messages and can keep their existing behaviour untouched.
 */

export interface SermonPartInfo {
  /** The title with the part marker removed, e.g. "The Power Of Faith". */
  baseTitle: string;
  /** 1-based part number. */
  part: number;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

// Roman numerals up to XII — enough for real sermon series.
const ROMAN_NUMBERS: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
  xi: 11,
  xii: 12,
};

/**
 * Matches a part marker anywhere in the title, swallowing the separators and
 * brackets around it plus an optional "of N" ("Part 1 of 3").
 *
 * The `\b(?:pt|part)\b` keyword is required — a bare number in a title
 * ("Psalm 23") must never be read as a part.
 */
const PART_MARKER_RE =
  /[\s\-–—(\[|,:]*\b(?:pt|part)\b\s*[.:]?\s*([0-9]{1,2}|[a-z]{1,8})(?:\s*of\s*[0-9]{1,2})?\s*[)\]]?/i;

/** Resolve "2" / "two" / "ii" → 2. Returns null when it isn't a number at all. */
function toPartNumber(token: string): number | null {
  const t = token
    .trim()
    .toLowerCase()
    .replace(/[.)\]]+$/, "");
  if (!t) return null;
  if (/^\d{1,2}$/.test(t)) {
    const n = parseInt(t, 10);
    return n > 0 ? n : null;
  }
  if (t in WORD_NUMBERS) return WORD_NUMBERS[t];
  if (t in ROMAN_NUMBERS) return ROMAN_NUMBERS[t];
  return null;
}

/**
 * Parse a sermon title into its base title + part number.
 * Returns `null` when the title has no explicit, resolvable part marker.
 */
export function parseSermonPart(rawTitle: string): SermonPartInfo | null {
  if (!rawTitle) return null;
  const title = rawTitle.trim();
  const m = PART_MARKER_RE.exec(title);
  if (!m) return null;

  const part = toPartNumber(m[1]);
  // "Part Of The Journey" → token "of" → not a number → not a part title.
  if (part === null) return null;

  // Join the two sides with a space: the marker match swallows the whitespace
  // around it, so a mid-title marker ("Faith Pt. 1 (Sunday)") would otherwise
  // fuse the remainder into "Faith(Sunday)".
  const before = title.slice(0, m.index);
  const after = title.slice(m.index + m[0].length);
  const baseTitle = `${before} ${after}`
    .replace(/\s{2,}/g, " ")
    .replace(/[\s\-–—(\[|,:]+$/, "")
    .replace(/^[\s\-–—)\]|,:]+/, "")
    .trim();

  if (!baseTitle) return null;
  return { baseTitle, part };
}

/** Loose key for comparing two base titles across punctuation/casing drift. */
export function normalizeBaseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** True when the title advertises itself as one part of a multi-part message. */
export function hasSermonPart(title: string): boolean {
  return parseSermonPart(title) !== null;
}

/**
 * From a pool of candidate messages, find the nearest lower ("previous") and
 * nearest higher ("next") part sharing the current message's base title.
 *
 * Uses nearest-lower / nearest-higher rather than exactly ±1 so a series with a
 * missing middle part still links up. Returns `{null, null}` when the current
 * title isn't a part title at all.
 */
export function findAdjacentParts<T extends { title: string }>(
  currentTitle: string,
  candidates: T[],
): { previous: T | null; next: T | null; currentPart: number | null } {
  const current = parseSermonPart(currentTitle);
  if (!current) return { previous: null, next: null, currentPart: null };

  const key = normalizeBaseTitle(current.baseTitle);

  let previous: T | null = null;
  let next: T | null = null;
  let bestPrev = -Infinity;
  let bestNext = Infinity;

  for (const candidate of candidates) {
    const parsed = parseSermonPart(candidate.title);
    if (!parsed) continue;
    if (normalizeBaseTitle(parsed.baseTitle) !== key) continue;
    if (parsed.part === current.part) continue;

    if (parsed.part < current.part && parsed.part > bestPrev) {
      bestPrev = parsed.part;
      previous = candidate;
    }
    if (parsed.part > current.part && parsed.part < bestNext) {
      bestNext = parsed.part;
      next = candidate;
    }
  }

  return { previous, next, currentPart: current.part };
}
