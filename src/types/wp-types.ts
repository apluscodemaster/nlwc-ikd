/**
 * WordPress Admin Publishing — TypeScript interfaces & Zod schemas
 */

import { z } from "zod/v4";

// =============================================================================
// FORM DATA INTERFACES
// =============================================================================

/** Base fields shared by all WP content types */
interface WPContentBase {
  title: string;
  content: string;
  status: "draft" | "publish";
}

export interface WPSermon extends WPContentBase {
  type: "sermon";
  speaker?: string;
  description?: string;
}

export interface WPTranscript extends WPContentBase {
  type: "transcript";
  speaker?: string;
  transcriptType: "sunday-message" | "sunday-school" | "bible-study" | "other-meetings" | "season-of-the-spirit";
}

export interface WPManual extends WPContentBase {
  type: "manual";
}

export type WPPublishPayload = WPSermon | WPTranscript | WPManual;

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

const statusSchema = z.enum(["draft", "publish"]);

export const wpSermonSchema = z.object({
  type: z.literal("sermon"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  status: statusSchema,
  speaker: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Sermon creation payload — audio sermons are NOT WordPress posts. They are
 * Series Engine messages, and the MP3 is referenced by a URL (S3), not a file
 * uploaded to WordPress. Validated separately from `wpPublishSchema` because it
 * targets the Series Engine backend (`/wp-json/nlwc/v1/sermons`) rather than
 * `/wp/v2/posts`.
 */
export const wpSermonCreateSchema = z.object({
  type: z.literal("sermon"),
  title: z.string().min(1, "Title is required"),
  audioUrl: z
    .string()
    .min(1, "Audio URL is required")
    .url("Audio URL must be a valid URL"),
  speaker: z.string().optional(),
  description: z.string().optional(),
  seriesId: z.coerce.number().int().positive().optional(),
  date: z.string().optional(),
  thumbnailUrl: z.string().url("Thumbnail URL must be a valid URL").optional(),
});

export type WPSermonCreatePayload = z.infer<typeof wpSermonCreateSchema>;

export const wpTranscriptSchema = z.object({
  type: z.literal("transcript"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  status: statusSchema,
  speaker: z.string().optional(),
  transcriptType: z.enum(["sunday-message", "sunday-school", "bible-study", "other-meetings", "season-of-the-spirit"]),
});

export const wpManualSchema = z.object({
  type: z.literal("manual"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  status: statusSchema,
});

/** Discriminated union — validates any of the three content types */
export const wpPublishSchema = z.discriminatedUnion("type", [
  wpSermonSchema,
  wpTranscriptSchema,
  wpManualSchema,
]);
