# Bible search data

The scripture search (navbar) loads two files from this folder at runtime,
lazily, on first focus:

- `kjv.json` — the full KJV text (**required**, ~4.5 MB)
- `kjv.index.json` — a prebuilt MiniSearch index (**optional but recommended**)

Both are git-ignored by default if your repo ignores large data; commit them or
generate them in CI as you prefer.

## 1. Add `kjv.json`

Provide a JSON file shaped as a flat array of verses (a `{ "verses": [...] }`
wrapper is also accepted):

```json
[
  { "book": "1Sam", "chapter": 9, "verse": 1, "text": "Now there was a man of Benjamin..." },
  { "book": "John", "chapter": 3, "verse": 16, "text": "For God so loved the world..." }
]
```

Field notes:

- `book` may be a full name (`"1 Samuel"`), a common abbreviation (`"1 Sam"`),
  or the compact form (`"1Sam"`). It is normalised to the compact ref via
  `src/data/bibleBooks.json`, so any of these work.
- `chapter` and `verse` are numbers; `text` is the verse text.

Public-domain sources (use KJV; fall back to WEB only if KJV is unavailable):

- KJV: <https://github.com/aruljohn/Bible-kjv> or
  <https://github.com/scrollmapper/bible_databases> (export to the shape above)
- WEB (World English Bible): <https://github.com/TehShrike/world_english_bible>

If 4.5 MB in one request is too heavy for your audience, split `kjv.json` by
book (e.g. `kjv/John.json`) and load on demand — but the current loader expects
a single `kjv.json`, so adjust `loadVerses()` in `src/lib/bibleSearch.ts` if you
go that route.

## 2. Generate `kjv.index.json`

With `kjv.json` in place:

```bash
node scripts/build-bible-index.mjs
```

This writes `public/data/kjv.index.json`. The runtime prefers this prebuilt
index; if it is missing, the browser builds the index from `kjv.json` on first
focus (slower first search, identical results).

> The MiniSearch options in `scripts/build-bible-index.mjs` must stay identical
> to `MINISEARCH_OPTIONS` in `src/lib/bibleSearch.ts`.
