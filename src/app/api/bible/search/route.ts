import { NextRequest, NextResponse } from "next/server";
import { normalizeApiBibleResults } from "@/lib/bibleApi";

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
  return NextResponse.json({ results: normalizeApiBibleResults(data, MAX_RESULTS) });
}
