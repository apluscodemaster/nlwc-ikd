/**
 * WordPress Publishing Service — Server-only
 *
 * Authenticates with the WordPress REST API using Application Passwords
 * and creates posts in the correct categories.
 */

import { WP_CATEGORIES } from "@/lib/wordpress";
import { htmlToGutenbergBlocks } from "@/lib/gutenberg";
import type {
  WPPublishPayload,
  WPSermonCreatePayload,
  WPSpeakerCreatePayload,
  WPSeriesCreatePayload,
} from "@/types/wp-types";
import type { SpeakerItem, SeriesItem } from "@/lib/audioSermons";
import { toStreamableAudioUrl } from "@/utils/audioUrl";

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";
const WP_USER = process.env.WP_APPLICATION_USER || "admin";
const WP_APP_PASSWORD = process.env.WP_APPLICATION_PASSWORD || "";

// =============================================================================
// HELPERS
// =============================================================================

/** Build Basic Auth header from application password credentials */
function getAuthHeader(): string {
  const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");
  return `Basic ${token}`;
}

/** Map content type to WordPress category IDs */
function getCategoryIds(payload: WPPublishPayload): number[] {
  switch (payload.type) {
    case "sermon":
      return [WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS];
    case "transcript": {
      const typeToCategory: Record<string, number> = {
        "sunday-message": WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS,
        "sunday-school": WP_CATEGORIES.SUNDAY_SCHOOL_TRANSCRIPTS,
        "bible-study": WP_CATEGORIES.BIBLE_STUDY_TRANSCRIPTS,
        "other-meetings": WP_CATEGORIES.OTHER_MEETINGS,
        "season-of-the-spirit": WP_CATEGORIES.SEASON_OF_THE_SPIRIT,
      };
      return [typeToCategory[payload.transcriptType] || WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS];
    }
    case "manual":
      return [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL];
  }
}

/**
 * Build the public frontend URL for a freshly-published post.
 * Transcripts/manuals resolve by WP slug; sermons by post ID. Returns a
 * root-relative URL so it resolves against the frontend origin (works in
 * dev and prod, regardless of the WordPress admin domain).
 */
function frontendPostUrl(
  payload: WPPublishPayload,
  id: number,
  slug: string,
): string {
  switch (payload.type) {
    case "transcript":
      return `/transcripts/${slug}`;
    case "manual":
      return `/manuals/${slug}`;
    case "sermon":
      return `/sermons/audio/${id}`;
  }
}

/** Optionally prepend speaker / description to the content body */
function buildContent(payload: WPPublishPayload): string {
  const parts: string[] = [];

  if ("speaker" in payload && payload.speaker) {
    parts.push(`<p><strong>Minister:</strong> ${payload.speaker}</p>`);
  }
  if ("description" in payload && payload.description) {
    parts.push(`<p>${payload.description}</p>`);
  }

  parts.push(payload.content);
  return parts.join("\n");
}

// =============================================================================
// PUBLIC API
// =============================================================================

export interface WPPublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  /** The resulting WordPress status — "future" when the post was scheduled. */
  status?: string;
  error?: string;
}

/**
 * Publish a new post to WordPress via the REST API.
 */
export async function publishToWordPress(
  payload: WPPublishPayload,
  options?: { featuredMediaId?: number; date?: string },
): Promise<WPPublishResult> {
  if (!WP_APP_PASSWORD) {
    return {
      success: false,
      error: "WP_APPLICATION_PASSWORD is not configured on the server.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    title: payload.title,
    // Serialize to Gutenberg blocks so WordPress stores native blocks instead
    // of a single Classic block (which would trigger wpautop and mangle the
    // content on the frontend).
    content: htmlToGutenbergBlocks(buildContent(payload)),
    status: payload.status,
    categories: getCategoryIds(payload),
  };

  // Attach featured image (thumbnail) if provided
  if (options?.featuredMediaId) {
    body.featured_media = options.featuredMediaId;
  }

  // Attach publish date. With status "publish" and a future date, WordPress
  // automatically stores the post as "future" (scheduled) and publishes it at
  // that moment. The date is naive local time, interpreted in the site's tz.
  if (options?.date) {
    body.date = options.date;
  }

  try {
    const response = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          (errorData as { message?: string }).message ||
          `WordPress API returned ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      id: number;
      link: string;
      slug: string;
      status?: string;
    };
    return {
      success: true,
      postId: data.id,
      // Point "View Post" at the frontend route, not the raw WordPress
      // permalink (ikdadmin.nlwc.church/<slug>). Relative URLs resolve against
      // the frontend origin the admin runs on.
      postUrl: frontendPostUrl(payload, data.id, data.slug),
      status: data.status,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Create an audio sermon in the Series Engine backend.
 *
 * Unlike transcripts/manuals, audio sermons are NOT WordPress posts — they are
 * Series Engine messages (`ikorodu_se_messages`). The MP3 is hosted on S3 and
 * referenced by `audio_url`; nothing is uploaded to WordPress here.
 *
 * Hits POST /wp-json/nlwc/v1/sermons (nlwc-sermons-api.php v1.5.0+).
 */
export async function createSermonInSeriesEngine(
  payload: WPSermonCreatePayload,
): Promise<WPPublishResult> {
  if (!WP_APP_PASSWORD) {
    return {
      success: false,
      error: "WP_APPLICATION_PASSWORD is not configured on the server.",
    };
  }

  const body: Record<string, unknown> = {
    title: payload.title,
    // Store the streamable form: a Drive "/view" link would be saved as-is
    // and fail to play for anyone reading it straight from the DB.
    audio_url: toStreamableAudioUrl(payload.audioUrl),
  };
  if (payload.speaker) body.speaker = payload.speaker;
  if (payload.speakerId) body.speaker_id = payload.speakerId;
  if (payload.description) body.description = payload.description;
  if (payload.seriesId) body.series_id = payload.seriesId;
  if (payload.date) body.date = payload.date;
  if (payload.thumbnailUrl) body.message_thumbnail = payload.thumbnailUrl;

  try {
    const response = await fetch(`${WP_URL}/wp-json/nlwc/v1/sermons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      return {
        success: false,
        error:
          "The Series Engine create endpoint is not registered. Ensure " +
          "nlwc-sermons-api.php v1.5.0+ is deployed to wp-content/mu-plugins/.",
      };
    }

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      return {
        success: false,
        error:
          errorData.message ||
          errorData.error ||
          `Series Engine API returned ${response.status}`,
      };
    }

    const data = (await response.json()) as { id: number; success?: boolean };
    return {
      success: true,
      postId: data.id,
      postUrl: `/sermons/audio/${data.id}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// =============================================================================
// SERMON TAXONOMY (Series Engine speakers & series)
// =============================================================================

export type WPTaxonomyResult<T> =
  | { success: true; item: T }
  | { success: false; error: string; existing?: T; status?: number };

/**
 * Shared POST against the nlwc/v1 taxonomy endpoints. Both return the created
 * row in the same shape the GET lists use, so the admin can drop it straight
 * into its dropdown without a refetch. A 409 carries the pre-existing row so
 * the caller can select that instead of failing.
 */
async function createSeriesEngineRow<T>(
  path: "speakers" | "series",
  body: Record<string, unknown>,
  context: string,
): Promise<WPTaxonomyResult<T>> {
  if (!WP_APP_PASSWORD) {
    return {
      success: false,
      error: "WP_APPLICATION_PASSWORD is not configured on the server.",
    };
  }

  try {
    const response = await fetch(`${WP_URL}/wp-json/nlwc/v1/sermons/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      return {
        success: false,
        status: 404,
        error:
          `The Series Engine ${context} endpoint is not registered. Ensure ` +
          "nlwc-sermons-api.php v1.6.0+ is deployed to wp-content/mu-plugins/.",
      };
    }

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    > & { message?: string; error?: string; existing?: T };

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error:
          data.message ||
          data.error ||
          `Series Engine API returned ${response.status}`,
        existing: data.existing,
      };
    }

    return { success: true, item: data as unknown as T };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Create a minister in `se_speakers` (wp-admin → Series Engine → Speakers). */
export function createSpeakerInSeriesEngine(
  payload: WPSpeakerCreatePayload,
): Promise<WPTaxonomyResult<SpeakerItem>> {
  return createSeriesEngineRow<SpeakerItem>(
    "speakers",
    { name: payload.name },
    "speaker",
  );
}

/** Create a series in `se_series` (wp-admin → Series Engine → Series). */
export function createSeriesInSeriesEngine(
  payload: WPSeriesCreatePayload,
): Promise<WPTaxonomyResult<SeriesItem>> {
  const body: Record<string, unknown> = { title: payload.title };
  if (payload.description) body.description = payload.description;
  return createSeriesEngineRow<SeriesItem>("series", body, "series");
}
