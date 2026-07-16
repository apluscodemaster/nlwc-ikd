/**
 * Bible API Service
 * Uses the free Bible API from bible-api.com, and API.Bible for additional
 * translations.
 */

const BIBLE_API_BASE = "https://bible-api.com";

/**
 * Translation for in-app scripture tooltips.
 *
 * bible-api.com defaults to the World English Bible when no translation is
 * requested, which is why these tooltips read "WEB" while the rest of the site
 * shows KJV (Logos RefTagger is configured with `bibleVersion: "KJV"` in
 * app/layout.tsx). Pin it so both engines agree — keep this and the RefTagger
 * setting in sync.
 */
const BIBLE_TRANSLATION = "kjv";

// Common book name abbreviations mapping to full names
const BOOK_ABBREVIATIONS: Record<string, string> = {
  // Old Testament
  gen: "Genesis",
  "gen.": "Genesis",
  ex: "Exodus",
  "ex.": "Exodus",
  exod: "Exodus",
  "exod.": "Exodus",
  lev: "Leviticus",
  "lev.": "Leviticus",
  num: "Numbers",
  "num.": "Numbers",
  deut: "Deuteronomy",
  "deut.": "Deuteronomy",
  josh: "Joshua",
  "josh.": "Joshua",
  judg: "Judges",
  "judg.": "Judges",
  ruth: "Ruth",
  "1 sam": "1 Samuel",
  "1sam": "1 Samuel",
  "1 samuel": "1 Samuel",
  "2 sam": "2 Samuel",
  "2sam": "2 Samuel",
  "2 samuel": "2 Samuel",
  "1 kings": "1 Kings",
  "1kings": "1 Kings",
  "1 kgs": "1 Kings",
  "2 kings": "2 Kings",
  "2kings": "2 Kings",
  "2 kgs": "2 Kings",
  "1 chron": "1 Chronicles",
  "1chron": "1 Chronicles",
  "1 chr": "1 Chronicles",
  "2 chron": "2 Chronicles",
  "2chron": "2 Chronicles",
  "2 chr": "2 Chronicles",
  ezra: "Ezra",
  neh: "Nehemiah",
  "neh.": "Nehemiah",
  esth: "Esther",
  "esth.": "Esther",
  job: "Job",
  ps: "Psalms",
  "ps.": "Psalms",
  psa: "Psalms",
  "psa.": "Psalms",
  psalm: "Psalms",
  psalms: "Psalms",
  prov: "Proverbs",
  "prov.": "Proverbs",
  eccl: "Ecclesiastes",
  "eccl.": "Ecclesiastes",
  "eccles.": "Ecclesiastes",
  song: "Song of Solomon",
  "song.": "Song of Solomon",
  sos: "Song of Solomon",
  isa: "Isaiah",
  "isa.": "Isaiah",
  jer: "Jeremiah",
  "jer.": "Jeremiah",
  lam: "Lamentations",
  "lam.": "Lamentations",
  ezek: "Ezekiel",
  "ezek.": "Ezekiel",
  dan: "Daniel",
  "dan.": "Daniel",
  hos: "Hosea",
  "hos.": "Hosea",
  joel: "Joel",
  amos: "Amos",
  obad: "Obadiah",
  "obad.": "Obadiah",
  jonah: "Jonah",
  mic: "Micah",
  "mic.": "Micah",
  nah: "Nahum",
  "nah.": "Nahum",
  hab: "Habakkuk",
  "hab.": "Habakkuk",
  zeph: "Zephaniah",
  "zeph.": "Zephaniah",
  hag: "Haggai",
  "hag.": "Haggai",
  zech: "Zechariah",
  "zech.": "Zechariah",
  mal: "Malachi",
  "mal.": "Malachi",

  // New Testament
  matt: "Matthew",
  "matt.": "Matthew",
  mt: "Matthew",
  "mt.": "Matthew",
  mark: "Mark",
  mk: "Mark",
  "mk.": "Mark",
  luke: "Luke",
  lk: "Luke",
  "lk.": "Luke",
  john: "John",
  jn: "John",
  "jn.": "John",
  acts: "Acts",
  rom: "Romans",
  "rom.": "Romans",
  "1 cor": "1 Corinthians",
  "1st cor": "1 Corinthians",
  "1cor": "1 Corinthians",
  "1 corinthians": "1 Corinthians",
  "1st corinthians": "1 Corinthians",
  "2 cor": "2 Corinthians",
  "2nd cor": "2 Corinthians",
  "2cor": "2 Corinthians",
  "2 corinthians": "2 Corinthians",
  "2nd corinthians": "2 Corinthians",
  gal: "Galatians",
  "gal.": "Galatians",
  eph: "Ephesians",
  "eph.": "Ephesians",
  phil: "Philippians",
  "phil.": "Philippians",
  col: "Colossians",
  "col.": "Colossians",
  "1 thess": "1 Thessalonians",
  "1thess": "1 Thessalonians",
  "1 thessalonians": "1 Thessalonians",
  "2 thess": "2 Thessalonians",
  "2thess": "2 Thessalonians",
  "2 thessalonians": "2 Thessalonians",
  "1 tim": "1 Timothy",
  "1tim": "1 Timothy",
  "1 timothy": "1 Timothy",
  "2 tim": "2 Timothy",
  "2tim": "2 Timothy",
  "2 timothy": "2 Timothy",
  titus: "Titus",
  philem: "Philemon",
  "philem.": "Philemon",
  heb: "Hebrews",
  "heb.": "Hebrews",
  jas: "James",
  "jas.": "James",
  james: "James",
  "1 pet": "1 Peter",
  "1pet": "1 Peter",
  "1 peter": "1 Peter",
  "2 pet": "2 Peter",
  "2pet": "2 Peter",
  "2 peter": "2 Peter",
  "1 john": "1 John",
  "1john": "1 John",
  "1 jn": "1 John",
  "2 john": "2 John",
  "2john": "2 John",
  "2 jn": "2 John",
  "3 john": "3 John",
  "3john": "3 John",
  "3 jn": "3 John",
  jude: "Jude",
  rev: "Revelation",
  "rev.": "Revelation",
};

export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
  verses: Array<{
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
}

export interface ParsedReference {
  original: string;
  book: string;
  chapter: number;
  /** Undefined for chapter-only references ("John 3"). */
  verseStart?: number;
  verseEnd?: number;
  apiReference: string;
}

/**
 * Normalize book name to full name for API
 */
/**
 * The 66 canonical books. This is the gate that decides whether something is a
 * scripture reference at all.
 *
 * It exists because `normalizeBookName` used to end in `|| book` — falling back
 * to whatever word preceded the numbers. That meant ordinary prose like
 * "Service 5:30", "Room 3:16" or "Lesson 12:5" parsed as valid references and
 * got underlined as scripture. Validating against a real book list fixes that,
 * and is what makes chapter-only detection ("John 3") safe — without it,
 * "Part 2" and "Lesson 3" would light up too.
 */
const CANONICAL_BOOKS = new Set([
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua",
  "judges", "ruth", "1 samuel", "2 samuel", "1 kings", "2 kings",
  "1 chronicles", "2 chronicles", "ezra", "nehemiah", "esther", "job",
  "psalm", "psalms", "proverbs", "ecclesiastes", "song of solomon", "isaiah",
  "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos",
  "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai",
  "zechariah", "malachi", "matthew", "mark", "luke", "john", "acts", "romans",
  "1 corinthians", "2 corinthians", "galatians", "ephesians", "philippians",
  "colossians", "1 thessalonians", "2 thessalonians", "1 timothy", "2 timothy",
  "titus", "philemon", "hebrews", "james", "1 peter", "2 peter", "1 john",
  "2 john", "3 john", "jude", "revelation",
]);

/**
 * Resolve a book name/abbreviation to its canonical form.
 * Returns null when it isn't a real book — callers MUST treat that as
 * "not a scripture reference".
 */
function normalizeBookName(book: string): string | null {
  const normalized = book.toLowerCase().trim();
  const mapped =
    BOOK_ABBREVIATIONS[normalized] ??
    BOOK_ABBREVIATIONS[normalized.replace(/\.$/, "")];
  const candidate = (mapped ?? book).trim();
  return CANONICAL_BOOKS.has(candidate.toLowerCase()) ? candidate : null;
}

/**
 * Parse a scripture reference string into structured data
 */
export function parseScriptureReference(
  reference: string,
): ParsedReference | null {
  // Matches, in one pass:
  //   "John 3:16"            verse
  //   "Rom. 8:28-30"         verse range
  //   "1 Cor. 13:1-3"        numbered book
  //   "(Matt. 5:1)"          parenthesised
  //   "John 3"               chapter only  (RefTagger tags these too)
  //   "John 3:16-4:2"        cross-chapter range
  //   "John 3:16,18"         comma list
  // The verse part is optional; everything is still gated on the book being
  // real (see normalizeBookName), which is what keeps "Lesson 3" out.
  const pattern =
    /\(?\s*(\d{1,3}\s+)?([A-Za-z]+\.?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*-\s*(?:(\d{1,3}):)?(\d{1,3}))?((?:\s*,\s*\d{1,3})+)?)?\s*\)?/i;

  const match = reference.match(pattern);
  if (!match) return null;

  const [
    original,
    bookPrefix,
    bookSuffix,
    chapter,
    verseStart,
    endChapter,
    verseEnd,
    verseList,
  ] = match;

  // Combine prefix and suffix to get full book name
  const fullBookName = bookPrefix
    ? `${bookPrefix.trim()} ${bookSuffix}`
    : bookSuffix;

  const normalizedBook = normalizeBookName(fullBookName);
  // Not a real book → not a reference. This is the false-positive gate.
  if (!normalizedBook) return null;

  // Format for bible-api.com, which accepts every form below (verified).
  let apiReference = `${normalizedBook} ${chapter}`;
  if (verseStart) {
    apiReference += `:${verseStart}`;
    if (verseEnd) {
      apiReference += endChapter ? `-${endChapter}:${verseEnd}` : `-${verseEnd}`;
    }
    if (verseList) apiReference += verseList.replace(/\s+/g, "");
  }

  return {
    original: original.replace(/[()]/g, "").trim(),
    book: normalizedBook,
    chapter: parseInt(chapter),
    verseStart: verseStart ? parseInt(verseStart) : undefined,
    verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
    apiReference,
  };
}

/**
 * Fetch verse text from Bible API with fallback formatting attempts
 */
export async function fetchBibleVerse(
  reference: string,
): Promise<BibleVerse | null> {
  try {
    const parsed = parseScriptureReference(reference);
    if (!parsed) return null;

    // Try the primary format
    let data = await tryFetchVerse(parsed.apiReference);

    // If the primary format fails, retry with the simplest form: book +
    // chapter (+ single verse). Skipped for chapter-only references, where the
    // primary form is already that simplest form — building "John 3:undefined"
    // would just be a guaranteed second miss.
    if (!data && parsed.verseStart !== undefined) {
      const alternativeRef = `${parsed.book} ${parsed.chapter}:${parsed.verseStart}`;
      data = await tryFetchVerse(alternativeRef);
    }

    if (!data) {
      console.warn(`Bible API could not find verse: "${parsed.apiReference}"`);
      return null;
    }

    return {
      reference: data.reference,
      text: data.text.trim(),
      translation: data.translation_name || "KJV",
      verses: data.verses || [],
    };
  } catch (error) {
    console.error("Error fetching Bible verse:", error);
    return null;
  }
}

/**
 * Raw payload from bible-api.com. Only the fields this module reads are
 * described; `error` is present when the API rejects the reference.
 * `verses` mirrors BibleVerse["verses"] — it is passed straight through.
 */
interface BibleApiResponse {
  reference: string;
  text: string;
  translation_name?: string;
  verses?: BibleVerse["verses"];
  error?: string;
}

/**
 * Helper to try fetching a single verse format
 */
async function tryFetchVerse(
  reference: string,
): Promise<BibleApiResponse | null> {
  try {
    const response = await fetch(
      `${BIBLE_API_BASE}/${encodeURIComponent(reference)}?translation=${BIBLE_TRANSLATION}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as BibleApiResponse;

    // Check if API returned an error or incomplete data
    if (data.error || !data.reference || !data.text) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error trying verse format "${reference}":`, error);
    return null;
  }
}

/**
 * Find all scripture references in a text
 */
export function findScriptureReferences(text: string): string[] {
  // Comprehensive regex to find scripture references with improved pattern:
  // - Multi-digit book numbers (1-3 John, etc)
  // - Multiple spaces
  // - Optional periods in book names
  const pattern =
    /\(?\s*(\d{1,3}?\s+)?([A-Za-z]+\.?)\s+(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?\s*\)?/gi;

  const matches = text.match(pattern);
  if (!matches) return [];

  // Filter out non-scripture matches and deduplicate
  const validRefs = matches.filter((match) => {
    const parsed = parseScriptureReference(match);
    return parsed !== null;
  });

  return [...new Set(validRefs)];
}

/**
 * Get Bible Gateway URL for a reference (for "Read More" link)
 */
export function getBibleGatewayUrl(reference: string): string {
  const parsed = parseScriptureReference(reference);
  if (!parsed) return "https://www.biblegateway.com";

  const searchRef = encodeURIComponent(parsed.apiReference);
  return `https://www.biblegateway.com/passage/?search=${searchRef}&version=KJV`;
}
