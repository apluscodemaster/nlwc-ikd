import { NextRequest, NextResponse } from "next/server";
import type { SearchResult } from "@/types/bible";

// API.Bible config (server-side only — BIBLE_API_KEY is never sent to the client).
const BASE = process.env.BIBLE_API_BASE ?? "https://rest.api.bible";
const BIBLE_ID = process.env.BIBLE_API_BIBLE_ID ?? "de4e12af7f28f599-01";
const API_KEY = process.env.BIBLE_API_KEY;
const MAX_RESULTS = 20;
// This KJV edition includes the Apocrypha; over-fetch so canon filtering still
// leaves a full page of results when apocryphal verses rank highly.
const UPSTREAM_LIMIT = 50;
// Cache identical queries for a day so repeated searches don't burn the free quota.
const CACHE_TTL_SECONDS = 86400;

// USFM book codes for the 66 canonical (Protestant) books. Used to drop
// Apocrypha (TOB, JDT, WIS, SIR, BAR, 1MA, ...) from results.
const CANONICAL_BOOKS = new Set([
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
  "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
  "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
  "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
]);

/** Strip API.Bible HTML/markers down to plain verse text. */
function clean(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/¶/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "1SA.9.3" -> { book: "1SA", chapter: 9, verse: 3 } */
function parseId(id: string): { book: string; chapter: number; verse: number } {
  const [book = "", chapter = "", verse = ""] = id.split(".");
  return { book, chapter: Number(chapter) || 0, verse: Number(verse) || 0 };
}

interface ApiVerse {
  id?: string;
  reference?: string;
  text?: string;
}

interface ApiPassage {
  id?: string;
  reference?: string;
  content?: string;
}

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2) return NextResponse.json({ results: [] });

  if (!API_KEY) {
    return NextResponse.json(
      { results: [], error: "BIBLE_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const url =
    `${BASE}/v1/bibles/${BIBLE_ID}/search` +
    `?query=${encodeURIComponent(query)}&limit=${UPSTREAM_LIMIT}&sort=relevance`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { "api-key": API_KEY },
      next: { revalidate: CACHE_TTL_SECONDS },
    });
  } catch {
    return NextResponse.json(
      { results: [], error: "Bible API request failed" },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { results: [], error: `Bible API responded ${upstream.status}` },
      { status: 502 },
    );
  }

  const data = (await upstream.json())?.data ?? {};
  const results: SearchResult[] = [];

  // Keyword matches (canonical 66 books only).
  for (const v of (data.verses ?? []) as ApiVerse[]) {
    const text = clean(v.text ?? "");
    if (!text || !v.id) continue;
    const { book, chapter, verse } = parseId(v.id);
    if (!CANONICAL_BOOKS.has(book)) continue;
    results.push({ id: v.id, book, chapter, verse, text, ref: v.reference ?? "" });
    if (results.length >= MAX_RESULTS) break;
  }

  // Reference queries (e.g. "John 3:16") come back as passages instead of verses.
  if (results.length === 0) {
    for (const p of (data.passages ?? []) as ApiPassage[]) {
      // Passage text is prefixed with the verse number; drop the leading digits.
      const text = clean(p.content ?? "").replace(/^\d+\s*/, "");
      if (!text || !p.id) continue;
      const { book, chapter, verse } = parseId(p.id);
      if (!CANONICAL_BOOKS.has(book)) continue;
      results.push({ id: p.id, book, chapter, verse, text, ref: p.reference ?? "" });
    }
  }

  return NextResponse.json({ results });
}
