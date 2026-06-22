// One-off: converts the downloaded thiagobodruk/bible en_kjv.json
// (array of 66 books in canonical order, each { abbrev, chapters: [[verse...]] })
// into public/data/kjv.json shaped as [{ book, chapter, verse, text }].
//
//   node scripts/transform-kjv.mjs ./tmp_en_kjv.json

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const srcPath = process.argv[2] ?? join(root, "tmp_en_kjv.json");
const books = JSON.parse(readFileSync(join(root, "src", "data", "bibleBooks.json"), "utf8"));
const raw = JSON.parse(readFileSync(srcPath, "utf8").replace(/^﻿/, ""));

if (raw.length !== books.length) {
  console.error(`Book count mismatch: source has ${raw.length}, expected ${books.length}.`);
  process.exit(1);
}

const verses = [];
raw.forEach((book, bookIdx) => {
  const ref = books[bookIdx].ref;
  book.chapters.forEach((chapter, chapterIdx) => {
    chapter.forEach((text, verseIdx) => {
      verses.push({
        book: ref,
        chapter: chapterIdx + 1,
        verse: verseIdx + 1,
        text: String(text).trim(),
      });
    });
  });
});

const outPath = join(root, "public", "data", "kjv.json");
writeFileSync(outPath, JSON.stringify(verses), "utf8");
console.log(`Wrote ${verses.length} verses -> ${outPath}`);
