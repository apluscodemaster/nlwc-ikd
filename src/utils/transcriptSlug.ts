import { logWarn, logError } from "@/lib/devLog";

export interface TranscriptStub {
  slug: string;
  title: string;
  id: number;
  categories: number[];
  baseSlug?: string;
}

/**
 * Strip numeric suffix from WordPress slugs (e.g., "the-gospel-of-christ-2" → "the-gospel-of-christ")
 * UNLESS the transcript title contains an intentional part reference like "Part 2", "pt 2", etc.
 */
export function getBaseSlug(slug: string, transcriptTitle: string): string {
  const partPattern = /\b(?:part|pt\.?)\s*\d+\b/i;
  if (partPattern.test(transcriptTitle)) {
    return slug;
  }
  return slug.replace(/-\d+$/, "");
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

export function normalizeTitle(title: string): string {
  return title
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
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

export function findTranscriptSlug(
  sermonTitle: string,
  transcripts: TranscriptStub[],
  sermonId?: number,
): string | null {
  const normalizedSermon = normalizeTitle(sermonTitle);
  if (!normalizedSermon) return null;

  const sermonPartNum = extractPartNumber(normalizedSermon);
  const sermonCore = getCoreTitle(normalizedSermon);

  // 1. Exact normalized title match
  for (const t of transcripts) {
    if (normalizeTitle(t.title) === normalizedSermon) {
      return t.baseSlug || t.slug;
    }
  }

  // 2. Core title + part number match
  if (sermonCore) {
    const coreCandidates: { t: TranscriptStub; normTitle: string }[] = [];
    for (const t of transcripts) {
      const normT = normalizeTitle(t.title);
      const tCore = getCoreTitle(normT);
      if (tCore === sermonCore) {
        coreCandidates.push({ t, normTitle: normT });
      }
    }

    if (coreCandidates.length > 0) {
      if (sermonPartNum !== null) {
        const partMatch = coreCandidates.find(
          (c) => extractPartNumber(c.normTitle) === sermonPartNum,
        );
        if (partMatch) return partMatch.t.baseSlug || partMatch.t.slug;
      } else {
        const noPartMatch = coreCandidates.find(
          (c) => extractPartNumber(c.normTitle) === null,
        );
        if (noPartMatch) return noPartMatch.t.baseSlug || noPartMatch.t.slug;
        const part1 = coreCandidates.find(
          (c) => extractPartNumber(c.normTitle) === 1,
        );
        if (part1) return part1.t.baseSlug || part1.t.slug;
      }
    }
  }

  // 3. Substring containment
  if (normalizedSermon.length >= 10) {
    for (const t of transcripts) {
      const normalizedTranscript = normalizeTitle(t.title);
      if (
        normalizedSermon.includes(normalizedTranscript) ||
        normalizedTranscript.includes(normalizedSermon)
      ) {
        const tPartNum = extractPartNumber(normalizedTranscript);
        if (
          sermonPartNum !== null &&
          tPartNum !== null &&
          sermonPartNum !== tPartNum
        ) {
          continue;
        }
        if (sermonPartNum !== null && tPartNum === null) {
          continue;
        }
        return t.baseSlug || t.slug;
      }
    }
  }

  // 4. Word-overlap scoring
  const sermonWords = new Set(
    normalizedSermon
      .split(" ")
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
  if (sermonWords.size >= 2) {
    let bestMatch: {
      slug: string;
      baseSlug: string;
      score: number;
    } | null = null;

    for (const t of transcripts) {
      const normalizedTranscript = normalizeTitle(t.title);
      const transcriptWords = new Set(
        normalizedTranscript
          .split(" ")
          .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
      );
      if (transcriptWords.size === 0) continue;

      const tPartNum = extractPartNumber(normalizedTranscript);
      if (
        sermonPartNum !== null &&
        tPartNum !== null &&
        sermonPartNum !== tPartNum
      ) {
        continue;
      }
      if (sermonPartNum !== null && tPartNum === null) {
        continue;
      }
      if (sermonPartNum === null && tPartNum !== null) {
        continue;
      }

      let matchCount = 0;
      for (const w of sermonWords) {
        if (transcriptWords.has(w)) matchCount++;
      }
      const score =
        matchCount / Math.max(sermonWords.size, transcriptWords.size);

      if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          slug: t.slug,
          baseSlug: t.baseSlug || t.slug,
          score,
        };
      }
    }
    if (bestMatch) {
      return bestMatch.baseSlug;
    }
  }

  return null;
}
