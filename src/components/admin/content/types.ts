import type React from "react";
import { Church, FileText, BookOpen } from "lucide-react";

export type ContentType = "sermon" | "transcript" | "manual";
export type ViewMode = "create" | "list";
export type PostStatus = "draft" | "publish";

export interface SermonFormData {
  title: string;
  status: PostStatus;
  speaker: string;
  seriesId: string;
  description: string;
  sermonDate: string;
  /** S3 (or other) URL of the MP3 — audio is NOT hosted on WordPress. */
  audioUrl: string;
}

export type TranscriptType =
  | "sunday-message"
  | "sunday-school"
  | "bible-study"
  | "other-meetings"
  | "season-of-the-spirit";

/** Options for the transcript-type select, in display order. */
export const TRANSCRIPT_TYPE_OPTIONS: { value: TranscriptType; label: string }[] =
  [
    { value: "sunday-message", label: "Sunday Message Transcript" },
    { value: "sunday-school", label: "Sunday School Transcript" },
    { value: "bible-study", label: "Bible Study Transcript" },
    { value: "other-meetings", label: "Other Meetings Transcript" },
    { value: "season-of-the-spirit", label: "Season of the Spirit" },
  ];

/** Map transcript types to WP category IDs for save operations. */
export const TRANSCRIPT_TYPE_TO_CATEGORY: Record<TranscriptType, number> = {
  "sunday-message": 20,
  "sunday-school": 31,
  "bible-study": 33,
  "other-meetings": 21,
  "season-of-the-spirit": 22,
};

/**
 * Reverse map (category id → type slug). The admin page does NOT use this to
 * classify posts — that is `resolveTranscriptType` in lib/wordpress.ts, which
 * the admin list applies before an item reaches the page. Kept as the tested
 * inverse of the map above.
 */
export const CATEGORY_TO_TRANSCRIPT_TYPE: Record<number, TranscriptType> = {
  20: "sunday-message",
  31: "sunday-school",
  33: "bible-study",
  21: "other-meetings",
  22: "season-of-the-spirit",
};

export interface TextFormData {
  title: string;
  content: string;
  status: PostStatus;
  speaker: string;
  transcriptType: TranscriptType;
  /** Scheduling: a future publishDate with status "publish" makes WordPress
   *  store the post as "future" (scheduled) and auto-publish it at the fixed
   *  release slot (see utils/publishSchedule). The admin picks a date only —
   *  there is no time of day to choose. */
  publishDate: string; // YYYY-MM-DD
}

export interface ContentItem {
  id: number;
  title: string;
  date: string;
  status: string;
  speaker?: string;
  type: string;
  excerpt?: string;
  content?: string;
  audioUrl?: string;
  thumbnail?: string;
  series?: string;
  transcriptType?: string;
  slug?: string;
  /** Raw WP timestamp ("YYYY-MM-DDTHH:mm:ss", naive site-local). `date` is a
   *  display label with no time, so editing needs this to keep the schedule. */
  dateIso?: string;
  /** Manual theme/series (resolved: meta override ?? parsed "THEME:" label). */
  theme?: string;
  /** Manual lesson label parsed from the excerpt. */
  lesson?: string;
}

export interface SpeakerItem {
  id: number;
  name: string;
  messageCount: number;
}

export interface SeriesItem {
  id: number;
  title: string;
  messageCount: number;
}

export const TABS: {
  id: ContentType;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}[] = [
  {
    id: "sermon",
    label: "Sermons",
    icon: Church,
    description: "Audio messages",
    color: "from-primary to-amber-500",
  },
  {
    id: "transcript",
    label: "Transcripts",
    icon: FileText,
    description: "Sunday Message, Bible Study & Sunday School Transcripts",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "manual",
    label: "Manuals",
    icon: BookOpen,
    description: "Sunday School manuals",
    color: "from-emerald-500 to-teal-500",
  },
];
