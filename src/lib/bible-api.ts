/**
 * Bible API Service
 * Uses the free Bible API from bible-api.com (World English Bible translation)
 * and API.Bible for additional translations
 */

const BIBLE_API_BASE = "https://bible-api.com";

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
  verseStart: number;
  verseEnd?: number;
  apiReference: string;
}

/**
 * Normalize book name to full name for API
 */
function normalizeBookName(book: string): string {
  const normalized = book.toLowerCase().trim();
  return BOOK_ABBREVIATIONS[normalized] || book;
}

/**
 * Parse a scripture reference string into structured data
 */
export function parseScriptureReference(
  reference: string,
): ParsedReference | null {
  // Pattern to match references like:
  // "John 3:16", "Rom. 8:28-30", "1 Cor. 13:1-3", "(Matt. 5:1)", "Psalm 23:1-6"
  const pattern = /\(?(\d?\s?[A-Za-z]+\.?)\s*(\d+):(\d+)(?:-(\d+))?\)?/i;

  const match = reference.match(pattern);
  if (!match) return null;

  const [original, book, chapter, verseStart, verseEnd] = match;
  const normalizedBook = normalizeBookName(book);

  // Format for bible-api.com: "John 3:16" or "John 3:16-18"
  let apiReference = `${normalizedBook} ${chapter}:${verseStart}`;
  if (verseEnd) {
    apiReference += `-${verseEnd}`;
  }

  return {
    original: original.replace(/[()]/g, "").trim(),
    book: normalizedBook,
    chapter: parseInt(chapter),
    verseStart: parseInt(verseStart),
    verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
    apiReference,
  };
}

/**
 * Fetch verse text from Bible API
 */
export async function fetchBibleVerse(
  reference: string,
): Promise<BibleVerse | null> {
  try {
    const parsed = parseScriptureReference(reference);
    if (!parsed) return null;

    const response = await fetch(
      `${BIBLE_API_BASE}/${encodeURIComponent(parsed.apiReference)}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    );

    if (!response.ok) {
      console.error(`Failed to fetch verse: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    return {
      reference: data.reference,
      text: data.text?.trim() || "",
      translation: "WEB", // World English Bible
      verses: data.verses || [],
    };
  } catch (error) {
    console.error("Error fetching Bible verse:", error);
    return null;
  }
}

/**
 * Find all scripture references in a text
 */
export function findScriptureReferences(text: string): string[] {
  // Comprehensive regex to find scripture references
  const pattern = /\(?\d?\s?[A-Za-z]+\.?\s+\d+:\d+(?:-\d+)?\)?/gi;

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
