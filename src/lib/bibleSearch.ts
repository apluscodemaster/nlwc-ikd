import type MiniSearch from "minisearch";
import type { Options as MiniSearchOptions } from "minisearch";
import type { ParsedReference, SearchResult, Verse } from "@/types/bible";
import bibleBooks from "@/data/bibleBooks.json";

interface BookEntry {
  ref: string;
  name: string;
  aliases: string[];
}

const BOOKS = bibleBooks as BookEntry[];

/**
 * MiniSearch configuration. These options MUST stay identical between the
 * prebuilt index (scripts/build-bible-index.mjs) and the runtime loader, or
 * MiniSearch.loadJSON will throw on mismatch.
 */
export const MINISEARCH_OPTIONS: MiniSearchOptions = {
  fields: ["text", "ref"],
  storeFields: ["book", "chapter", "verse", "text", "ref"],
};

const SEARCH_OPTIONS = {
  prefix: true,
  fuzzy: 0.2,
  boost: { ref: 2 },
  combineWith: "AND" as const,
};

const DATA_BASE = "/data";
const MAX_RESULTS = 20;

/** Strip everything but letters/digits and lowercase, so "1 Sam." -> "1sam". */
function normalize(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** alias (normalized) -> canonical compact ref, e.g. "1samuel" -> "1Sam". */
const BOOK_LOOKUP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const book of BOOKS) {
    map.set(normalize(book.ref), book.ref);
    map.set(normalize(book.name), book.ref);
    for (const alias of book.aliases) map.set(normalize(alias), book.ref);
  }
  return map;
})();

function resolveBook(token: string): string | null {
  return BOOK_LOOKUP.get(normalize(token)) ?? null;
}

/**
 * Parse a scripture reference such as "1 Sam 9:1", "1sam9:1" or "John 3 16".
 * Returns the canonical book ref plus chapter and optional verse.
 */
export function parseReference(query: string): ParsedReference | null {
  // Book token must end in a letter so "1sam9" splits into book "1sam" + "9".
  const match = query
    .trim()
    .match(/^(.*?[a-z])\s*(\d+)(?:[\s:.\-]+(\d+))?\s*$/i);
  if (!match) return null;

  const book = resolveBook(match[1]);
  if (!book) return null;

  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : undefined;
  if (!Number.isFinite(chapter)) return null;

  return { book, chapter, verse };
}

function verseId(book: string, chapter: number, verse: number): string {
  return `${book}.${chapter}.${verse}`;
}

function makeRef(book: string, chapter: number, verse: number): string {
  return `${book} ${chapter}:${verse}`;
}

interface NormalizedVerse extends Verse {
  id: string;
}

/** Coerce a raw verse record (any common KJV JSON shape) into our Verse type. */
function normalizeVerse(raw: Record<string, unknown>): NormalizedVerse | null {
  const rawBook = String(raw.book ?? raw.book_name ?? raw.bookName ?? "");
  const chapter = Number(raw.chapter);
  const verse = Number(raw.verse);
  const text = String(raw.text ?? "").trim();
  if (!rawBook || !Number.isFinite(chapter) || !Number.isFinite(verse) || !text) {
    return null;
  }
  const book = resolveBook(rawBook) ?? rawBook;
  return {
    id: verseId(book, chapter, verse),
    book,
    chapter,
    verse,
    text,
    ref: makeRef(book, chapter, verse),
  };
}

// ── Lazy-loaded singletons ──────────────────────────────────────────────
let miniSearch: MiniSearch<NormalizedVerse> | null = null;
let verseIndex: Map<string, NormalizedVerse> | null = null;
let chapterIndex: Map<string, NormalizedVerse[]> | null = null;
let initPromise: Promise<void> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

async function loadVerses(): Promise<NormalizedVerse[]> {
  const raw = await fetchJson<unknown>(`${DATA_BASE}/kjv.json`);
  // Accept either a flat array of verses or a { verses: [...] } wrapper.
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { verses?: unknown }).verses)
      ? (raw as { verses: unknown[] }).verses
      : [];
  const verses: NormalizedVerse[] = [];
  for (const item of list) {
    const v = normalizeVerse(item as Record<string, unknown>);
    if (v) verses.push(v);
  }
  if (verses.length === 0) {
    throw new Error("kjv.json contained no usable verses");
  }
  return verses;
}

function buildLookups(verses: NormalizedVerse[]): void {
  verseIndex = new Map();
  chapterIndex = new Map();
  for (const v of verses) {
    verseIndex.set(v.id, v);
    const key = `${v.book}.${v.chapter}`;
    const bucket = chapterIndex.get(key);
    if (bucket) bucket.push(v);
    else chapterIndex.set(key, [v]);
  }
}

/**
 * Lazy-load the KJV text and MiniSearch index. Safe to call repeatedly: the
 * first call performs the work, later calls await the same promise.
 */
export function initBibleSearch(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const MiniSearchCtor = (await import("minisearch")).default;
      const verses = await loadVerses();
      buildLookups(verses);

      // Prefer the prebuilt index; fall back to building it in the browser so
      // the feature works even before scripts/build-bible-index.mjs is run.
      try {
        const indexJson = await fetch(`${DATA_BASE}/kjv.index.json`);
        if (!indexJson.ok) throw new Error(String(indexJson.status));
        miniSearch = MiniSearchCtor.loadJSON(
          await indexJson.text(),
          MINISEARCH_OPTIONS,
        );
      } catch {
        miniSearch = new MiniSearchCtor<NormalizedVerse>(MINISEARCH_OPTIONS);
        await miniSearch.addAllAsync(verses);
      }
    })().catch((err) => {
      // Reset so a later focus can retry after a transient failure.
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export function isReady(): boolean {
  return miniSearch !== null && verseIndex !== null;
}

function lookupReference(parsed: ParsedReference): SearchResult[] {
  if (!verseIndex || !chapterIndex) return [];

  if (parsed.verse != null) {
    const hit = verseIndex.get(
      verseId(parsed.book, parsed.chapter, parsed.verse),
    );
    return hit ? [{ ...hit, score: Number.MAX_SAFE_INTEGER }] : [];
  }

  // Chapter-only reference: return the opening verses of that chapter.
  const chapter = chapterIndex.get(`${parsed.book}.${parsed.chapter}`) ?? [];
  return chapter
    .slice()
    .sort((a, b) => a.verse - b.verse)
    .slice(0, MAX_RESULTS)
    .map((v) => ({ ...v, score: Number.MAX_SAFE_INTEGER }));
}

/**
 * Search the KJV text. A recognised verse reference (e.g. "John 3:16") jumps
 * straight to the matching verse(s); anything else runs a fuzzy/prefix search.
 * Returns up to 20 results. initBibleSearch() must have resolved first.
 */
export function searchBible(query: string): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2 || !miniSearch) return [];

  const parsed = parseReference(trimmed);
  if (parsed) {
    const direct = lookupReference(parsed);
    if (direct.length > 0) return direct;
    // Fall through to keyword search if the reference points nowhere.
  }

  return miniSearch
    .search(trimmed, SEARCH_OPTIONS)
    .slice(0, MAX_RESULTS)
    .map((r) => ({
      id: String(r.id),
      book: r.book as string,
      chapter: r.chapter as number,
      verse: r.verse as number,
      text: r.text as string,
      ref: r.ref as string,
      score: r.score,
    }));
}
