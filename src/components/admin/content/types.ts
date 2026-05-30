import type React from "react";
import { Church, FileText, BookOpen } from "lucide-react";

export type ContentType = "sermon" | "transcript" | "manual";
export type ViewMode = "create" | "list";

export interface SermonFormData {
  title: string;
  status: "draft" | "publish";
  speaker: string;
  seriesId: string;
  description: string;
  sermonDate: string;
  audioFile: FileList | null;
  thumbnailFile: FileList | null;
}

export type TranscriptType =
  | "sunday-message"
  | "sunday-school"
  | "bible-study"
  | "other-meetings"
  | "season-of-the-spirit";

export const TRANSCRIPT_TYPE_TO_CATEGORY: Record<TranscriptType, number> = {
  "sunday-message": 20,
  "sunday-school": 31,
  "bible-study": 33,
  "other-meetings": 21,
  "season-of-the-spirit": 22,
};

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
  status: "draft" | "publish";
  speaker: string;
  transcriptType: TranscriptType;
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
