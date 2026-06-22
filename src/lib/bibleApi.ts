import type { SearchResult } from "@/types/bible";

// USFM book codes for the 66 canonical (Protestant) books. Used to drop the
// Apocrypha (TOB, JDT, WIS, SIR, BAR, 1MA, ...) that ships with some KJV
// editions on API.Bible.
export const CANONICAL_BOOKS = new Set([
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
  "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
  "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
  "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
]);

export function isCanonicalBook(code: string): boolean {
  return CANONICAL_BOOKS.has(code);
}

/** Strip API.Bible HTML/markers down to plain verse text. */
export function cleanVerseText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/¶/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "1SA.9.3" -> { book: "1SA", chapter: 9, verse: 3 } */
export function parseVerseId(id: string): {
  book: string;
  chapter: number;
  verse: number;
} {
  const [book = "", chapter = "", verse = ""] = id.split(".");
  return { book, chapter: Number(chapter) || 0, verse: Number(verse) || 0 };
}

export interface ApiBibleVerse {
  id?: string;
  reference?: string;
  text?: string;
}

export interface ApiBiblePassage {
  id?: string;
  reference?: string;
  content?: string;
}

export interface ApiBibleSearchData {
  verses?: ApiBibleVerse[];
  passages?: ApiBiblePassage[];
}

/**
 * Normalize an API.Bible search payload (`response.data`) into canonical
 * SearchResult[]. Keyword hits come back as `verses`; a bare reference (e.g.
 * "John 3:16") comes back as `passages` with HTML content instead. Apocryphal
 * books are dropped and the list is capped at `max`.
 */
export function normalizeApiBibleResults(
  data: ApiBibleSearchData,
  max: number,
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const v of data.verses ?? []) {
    const text = cleanVerseText(v.text ?? "");
    if (!text || !v.id) continue;
    const { book, chapter, verse } = parseVerseId(v.id);
    if (!isCanonicalBook(book)) continue;
    results.push({ id: v.id, book, chapter, verse, text, ref: v.reference ?? "" });
    if (results.length >= max) break;
  }

  if (results.length === 0) {
    for (const p of data.passages ?? []) {
      // Passage text is prefixed with the verse number; drop the leading digits.
      const text = cleanVerseText(p.content ?? "").replace(/^\d+\s*/, "");
      if (!text || !p.id) continue;
      const { book, chapter, verse } = parseVerseId(p.id);
      if (!isCanonicalBook(book)) continue;
      results.push({ id: p.id, book, chapter, verse, text, ref: p.reference ?? "" });
    }
  }

  return results;
}
