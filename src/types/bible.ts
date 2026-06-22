export interface Verse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  ref: string;
}

export interface SearchResult extends Verse {
  id: string;
  score?: number;
}

export interface ParsedReference {
  book: string;
  chapter: number;
  verse?: number;
}
