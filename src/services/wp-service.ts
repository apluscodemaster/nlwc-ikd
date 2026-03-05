/**
 * WordPress Publishing Service — Server-only
 *
 * Authenticates with the WordPress REST API using Application Passwords
 * and creates posts in the correct categories.
 */

import { WP_CATEGORIES } from "@/lib/wordpress";
import type { WPPublishPayload } from "@/types/wp-types";

const WP_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikorodu.nlwc.church";
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
    case "transcript":
      return payload.transcriptType === "sunday-school"
        ? [WP_CATEGORIES.SUNDAY_SCHOOL_TRANSCRIPTS]
        : [WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS];
    case "manual":
      return [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL];
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
  error?: string;
}

/**
 * Publish a new post to WordPress via the REST API.
 */
export async function publishToWordPress(
  payload: WPPublishPayload,
  options?: { featuredMediaId?: number },
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
    content: buildContent(payload),
    status: payload.status,
    categories: getCategoryIds(payload),
  };

  // Attach featured image (thumbnail) if provided
  if (options?.featuredMediaId) {
    body.featured_media = options.featuredMediaId;
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

    const data = (await response.json()) as { id: number; link: string };
    return {
      success: true,
      postId: data.id,
      postUrl: data.link,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
