// Builds public/data/kjv.index.json (a prebuilt MiniSearch index) from
// public/data/kjv.json. Run with: node scripts/build-bible-index.mjs
//
// The MiniSearch options here MUST match MINISEARCH_OPTIONS in
// src/lib/bibleSearch.ts, or the browser's MiniSearch.loadJSON will reject it.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import MiniSearch from "minisearch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "public", "data");
const versesPath = join(dataDir, "kjv.json");
const indexPath = join(dataDir, "kjv.index.json");
const booksPath = join(root, "src", "data", "bibleBooks.json");

// Must stay identical to MINISEARCH_OPTIONS in src/lib/bibleSearch.ts.
// No storeFields: results are resolved by id from kjv.json at runtime.
const MINISEARCH_OPTIONS = {
  fields: ["text", "ref"],
  storeFields: [],
};

function normalize(token) {
  return String(token).toLowerCase().replace(/[^a-z0-9]/g, "");
}

if (!existsSync(versesPath)) {
  console.error(`Missing ${versesPath}. Add kjv.json first (see public/data/README.md).`);
  process.exit(1);
}

const books = JSON.parse(readFileSync(booksPath, "utf8"));
const bookLookup = new Map();
for (const book of books) {
  bookLookup.set(normalize(book.ref), book.ref);
  bookLookup.set(normalize(book.name), book.ref);
  for (const alias of book.aliases) bookLookup.set(normalize(alias), book.ref);
}

const raw = JSON.parse(readFileSync(versesPath, "utf8"));
const list = Array.isArray(raw) ? raw : Array.isArray(raw.verses) ? raw.verses : [];

const documents = [];
for (const item of list) {
  const rawBook = String(item.book ?? item.book_name ?? item.bookName ?? "");
  const chapter = Number(item.chapter);
  const verse = Number(item.verse);
  const text = String(item.text ?? "").trim();
  if (!rawBook || !Number.isFinite(chapter) || !Number.isFinite(verse) || !text) continue;
  const book = bookLookup.get(normalize(rawBook)) ?? rawBook;
  documents.push({
    id: `${book}.${chapter}.${verse}`,
    book,
    chapter,
    verse,
    text,
    ref: `${book} ${chapter}:${verse}`,
  });
}

if (documents.length === 0) {
  console.error("No usable verses found in kjv.json.");
  process.exit(1);
}

const miniSearch = new MiniSearch(MINISEARCH_OPTIONS);
miniSearch.addAll(documents);
writeFileSync(indexPath, JSON.stringify(miniSearch), "utf8");

console.log(`Indexed ${documents.length} verses -> ${indexPath}`);
