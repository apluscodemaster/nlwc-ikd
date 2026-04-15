/**
 * Audio Sermons Library
 *
 * Fetches audio sermon data from the WordPress backend.
 *
 * Strategy:
 *   1. PRIMARY: Custom WP REST API endpoint (/wp-json/nlwc/v1/sermons)
 *      Created by the nlwc-sermons-api.php mu-plugin.
 *   2. FALLBACK: HTML scraping of the /audio-messages/ page
 *      Used when the custom API endpoint is not yet deployed.
 *
 * Audio files are hosted on AWS S3 (nlwc-ikorodu.s3.us-east-2.amazonaws.com).
 *
 * Caching & Deduplication:
 *   - HTTP Cache-Control: 10 minutes (s-maxage=600)
 *   - Request deduplication: Prevents duplicate in-flight requests within 1 minute
 */

import { deduplicatedFetch } from "./requestCache";

const BASE_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";
const WP_API_URL = `${BASE_URL}/wp-json/nlwc/v1`;
const AUDIO_MESSAGES_URL = `${BASE_URL}/audio-messages/`;

export interface AudioSermon {
  id: number;
  title: string;
  slug?: string;
  speaker: string;
  date: string;
  listenUrl: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  series?: string;
  seriesId?: number;
  duration?: string;
}

export interface AudioSermonsResponse {
  data: AudioSermon[];
  pagination: {
    page: number;
    perPage: number;
    totalPages: number;
    total: number;
  };
}

export interface SeriesItem {
  id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  messageCount: number;
}

export interface SpeakerItem {
  id: number;
  name: string;
  messageCount: number;
}

export interface TopicItem {
  id: number;
  name: string;
  messageCount: number;
}

export interface AudioSermonsFilters {
  page?: number;
  perPage?: number;
  search?: string;
  seriesId?: number;
  speakerId?: number;
  topicId?: number;
  year?: number;
  order?: "ASC" | "DESC";
}

// =============================================================================
// FETCH OPTIONS (handles SSL certificate issues in development)
// =============================================================================

function getFetchOptions(): RequestInit {
  return {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NLWCGallery/1.0)",
    },
    next: { revalidate: 600 }, // Cache for 10 minutes
  } as RequestInit;
}

/**
 * Fix thumbnail URLs that use the frontend domain (ikorodu.nlwc.church)
 * instead of the actual WP server (ikdadmin.nlwc.church).
 *
 * WP's siteurl is set to the frontend domain, so all media URLs reference it.
 * But images are physically served from ikdadmin.nlwc.church. The Next.js
 * Image component fetches external URLs directly (bypassing Next rewrites),
 * so we need to rewrite the hostname.
 */
function fixThumbnailUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  return url.replace(
    "://ikorodu.nlwc.church/wp-content/",
    "://ikdadmin.nlwc.church/wp-content/",
  );
}

// =============================================================================
// PRIMARY: WordPress REST API (requires nlwc-sermons-api.php mu-plugin)
// =============================================================================

/**
 * Try fetching from the custom WP REST API endpoint.
 * Returns null if the endpoint is not available (404).
 */
async function fetchFromWpApi(
  filters: AudioSermonsFilters,
): Promise<AudioSermonsResponse | null> {
  try {
    const params = new URLSearchParams({
      page: (filters.page || 1).toString(),
      per_page: (filters.perPage || 12).toString(),
    });
    if (filters.search) params.set("search", filters.search);
    if (filters.seriesId) params.set("series_id", filters.seriesId.toString());
    if (filters.speakerId)
      params.set("speaker_id", filters.speakerId.toString());
    if (filters.topicId) params.set("topic_id", filters.topicId.toString());
    if (filters.year) params.set("year", filters.year.toString());
    if (filters.order) params.set("order", filters.order);

    const response = await deduplicatedFetch(
      `${WP_API_URL}/sermons?${params}`,
      getFetchOptions(),
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`WP API error: ${response.status}`);
    }

    const result = await response.json();

    const sermons: AudioSermon[] = (result.data || []).map(
      (item: Record<string, unknown>) => ({
        id: item.id,
        title: item.title as string,
        speaker: item.speaker as string,
        date: formatDate(item.date as string),
        listenUrl: `${AUDIO_MESSAGES_URL}?enmse=1&enmse_am=1&enmse_mid=${item.id}&enmse_av=1`,
        downloadUrl: (item.audioUrl as string) || undefined,
        thumbnailUrl: fixThumbnailUrl(item.thumbnail as string),
        series: (item.seriesTitle as string) || undefined,
        seriesId: item.seriesId as number,
        duration: (item.duration as string) || undefined,
      }),
    );

    return {
      data: sermons,
      pagination: result.pagination,
    };
  } catch (error) {
    console.warn("WP REST API not available, falling back to scraping:", error);
    return null;
  }
}

/**
 * Try fetching a single sermon detail from the custom WP REST API.
 * Includes retry logic for transient failures.
 * Uses plain fetch() for retries to avoid "Body already read" errors from deduplicatedFetch caching.
 */
async function fetchDetailFromWpApi(
  messageId: number,
): Promise<AudioSermon | null> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use plain fetch() for retries to get fresh response objects
      // (deduplicatedFetch caches the promise, causing "Body already read" on retries)
      const url = `${WP_API_URL}/sermons/${messageId}`;
      const response = await fetch(url, getFetchOptions());

      if (response.status === 404) {
        // 404 means the sermon doesn't exist, don't retry
        console.warn(
          `[AudioSermons] Sermon ${messageId} not found in API (404)`,
        );
        return null;
      }

      if (!response.ok) {
        lastError = new Error(`API returned ${response.status}`);
        // Retry on server errors
        if (attempt < maxRetries) {
          console.warn(
            `[AudioSermons] API error for sermon ${messageId} (attempt ${attempt + 1}/${maxRetries + 1}): ${response.status}`,
          );
          // Brief delay before retry
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        return null;
      }

      const item = await response.json();

      return {
        id: item.id,
        title: item.title,
        speaker: item.speaker,
        date: formatDate(item.date),
        listenUrl: `${AUDIO_MESSAGES_URL}?enmse=1&enmse_am=1&enmse_mid=${item.id}&enmse_av=1`,
        downloadUrl: item.audioUrl || undefined,
        thumbnailUrl: fixThumbnailUrl(item.thumbnail || item.speakerThumbnail),
        series: item.seriesTitle || undefined,
      };
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        console.warn(
          `[AudioSermons] API request failed for sermon ${messageId} (attempt ${attempt + 1}/${maxRetries + 1}):`,
          lastError?.message,
        );
        // Brief delay before retry
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  console.warn(
    `[AudioSermons] API failed for sermon ${messageId} after ${maxRetries + 1} attempts`,
    lastError?.message,
  );
  return null;
}

// =============================================================================
// FALLBACK: HTML Scraping (works without any WP changes)
// =============================================================================

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * Parse the listing page HTML to extract sermon data.
 */
function parseListingHtml(html: string): {
  sermons: AudioSermon[];
  totalPages: number;
} {
  const sermons: AudioSermon[] = [];

  // Split by message card divs
  const cardRegex =
    /<div\s+class="enmse-message-card[^"]*">([\s\S]*?)(?=<div\s+class="enmse-message-card|<div\s+class="enmse-page-nav|$)/gi;
  let cardMatch;

  while ((cardMatch = cardRegex.exec(html)) !== null) {
    const cardHtml = cardMatch[1];

    // Extract thumbnail
    const thumbMatch = cardHtml.match(/src="([^"]+)"\s+alt="[^"]*Image"/i);
    const thumbnailUrl = fixThumbnailUrl(thumbMatch?.[1]);

    // Extract date from <h6>
    const dateMatch = cardHtml.match(/<h6>(.*?)<\/h6>/i);
    const date = dateMatch?.[1]?.trim() || "";

    // Extract title from <h5>
    const titleMatch = cardHtml.match(/<h5>(.*?)<\/h5>/i);
    const title = titleMatch?.[1]?.trim() || "";

    // Extract speaker from <p class="enmse-speaker-name">
    const speakerMatch = cardHtml.match(
      /<p\s+class="enmse-speaker-name">(.*?)<\/p>/i,
    );
    const speaker = speakerMatch?.[1]?.trim() || "";

    // Extract message ID from enmse_mid parameter
    const midMatch = cardHtml.match(/enmse_mid=(\d+)/);
    const messageId = midMatch ? parseInt(midMatch[1]) : 0;

    if (title && messageId) {
      sermons.push({
        id: messageId,
        title,
        speaker,
        date,
        listenUrl: `${AUDIO_MESSAGES_URL}?enmse=1&enmse_am=1&enmse_mid=${messageId}&enmse_av=1`,
        thumbnailUrl,
      });
    }
  }

  // Extract total pages from pagination
  let totalPages = 1;
  const pagesMatch = html.match(/enmse_p=(\d+)/);
  if (pagesMatch) {
    totalPages = parseInt(pagesMatch[1]);
  }

  return { sermons, totalPages };
}

/**
 * Parse a single message detail page to get download URL and series info
 */
function parseDetailHtml(html: string): {
  downloadUrl?: string;
  series?: string;
  title?: string;
  speaker?: string;
  date?: string;
  thumbnailUrl?: string;
} {
  // Extract download URL — S3 mp3 link
  const downloadMatch = html.match(
    /href="(https:\/\/nlwc-ikorodu\.s3[^"]+\.mp3)"/i,
  );

  // Extract series/category
  const seriesBlock = html.match(/From Category:[\s\S]*?<\/h3>/i);
  let series: string | undefined;
  if (seriesBlock) {
    const rawText = stripHtml(seriesBlock[0])
      .replace(/From Category:\s*/i, "")
      .replace(/^["""\u201c\u201d]+|["""\u201c\u201d]+$/g, "")
      .trim();
    series = rawText || undefined;
  }

  // Extract title
  const titleMatch = html.match(/<h2[^>]*>(.*?)<\/h2>/i);
  const title = titleMatch?.[1] ? stripHtml(titleMatch[1]) : undefined;

  // Extract speaker
  const speakerMatch = html.match(/More Messages from\s+([^<"]+)/i);

  // Extract date
  const dateMatch = html.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/,
  );

  return {
    downloadUrl: downloadMatch?.[1] || undefined,
    series,
    title,
    speaker: speakerMatch?.[1]?.trim(),
    date: dateMatch?.[0],
  };
}

/**
 * Fetch audio sermons listing by scraping the HTML page
 */
async function fetchFromScraping(
  page: number,
  perPage: number,
): Promise<AudioSermonsResponse> {
  let url = AUDIO_MESSAGES_URL;
  if (page > 1) {
    const offset = (page - 1) * 10;
    url = `${AUDIO_MESSAGES_URL}?enmse=1&enmse_am=1&enmse_o=1&enmse_c=${offset}&enmse_p=51&enmse_sds=1`;
  }

  const response = await fetch(url, getFetchOptions());

  if (!response.ok) {
    throw new Error(`Failed to fetch audio messages: ${response.status}`);
  }

  const html = await response.text();
  const { sermons, totalPages } = parseListingHtml(html);

  return {
    data: sermons.slice(0, perPage),
    pagination: {
      page,
      perPage,
      totalPages,
      total: totalPages * 10,
    },
  };
}

/**
 * Fetch a single sermon detail by scraping its detail page
 */
async function fetchDetailFromScraping(
  messageId: number,
): Promise<AudioSermon | null> {
  const scrapeUrl = `${AUDIO_MESSAGES_URL}?enmse=1&enmse_am=1&enmse_mid=${messageId}&enmse_av=1`;

  try {
    // Use direct fetch (not deduplicatedFetch) to avoid caching issues on failures
    const response = await fetch(scrapeUrl, getFetchOptions());

    if (!response.ok) {
      console.warn(
        `[AudioSermons] Scraping failed for sermon ${messageId}: HTTP ${response.status}`,
      );
      return null;
    }

    const html = await response.text();
    const detail = parseDetailHtml(html);

    // Check if we got meaningful data
    if (!detail.title) {
      console.warn(
        `[AudioSermons] Scraping returned no title for sermon ${messageId}`,
      );
      return null;
    }

    return {
      id: messageId,
      title: detail.title || "",
      speaker: detail.speaker || "",
      date: detail.date || "",
      listenUrl: scrapeUrl,
      downloadUrl: detail.downloadUrl,
      series: detail.series,
    };
  } catch (error) {
    console.warn(
      `[AudioSermons] Scraping error for sermon ${messageId}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

// =============================================================================
// PUBLIC API (auto-selects WP REST API or scraping fallback)
// =============================================================================

/**
 * Format a date string for display
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // Already formatted
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Fetch audio sermons listing (paginated + filtered)
 * Automatically uses WP REST API if available, falls back to scraping.
 */
export async function getAudioSermons(
  filters: AudioSermonsFilters = {},
): Promise<AudioSermonsResponse> {
  // Try WP REST API first
  const apiResult = await fetchFromWpApi(filters);
  if (apiResult) return apiResult;

  // Fall back to scraping (no filter support)
  return fetchFromScraping(filters.page || 1, filters.perPage || 12);
}

/**
 * Fetch recent sermons and search for a specific ID (limited fallback to avoid CPU burn)
 * Only fetches the first page of recent sermons (most likely to contain the ID)
 */
async function searchRecentSermons(
  messageId: number,
): Promise<AudioSermon | null> {
  try {
    console.log(
      `[AudioSermons] Searching for sermon ${messageId} in recent sermons`,
    );
    // Only fetch first page (12 items) to minimize API load
    const response = await getAudioSermons({ perPage: 12, page: 1 });

    if (response && response.data.length > 0) {
      const found = response.data.find((s) => s.id === messageId);
      if (found) {
        console.log(
          `[AudioSermons] Found sermon ${messageId} in recent sermons`,
        );
        return found;
      }
    }

    console.warn(
      `[AudioSermons] Sermon ${messageId} not in recent sermons (may be older)`,
    );
  } catch (error) {
    console.warn(
      `[AudioSermons] Recent sermons search failed:`,
      error instanceof Error ? error.message : String(error),
    );
  }

  return null;
}

/**
 * Fetch details for a specific audio sermon
 * Automatically uses WP REST API if available, falls back to scraping,
 * then to searching the full listing as a last resort.
 * If all fail, returns a minimal sermon object with a playable listen URL.
 */
export async function getAudioSermonDetail(
  messageId: number,
): Promise<AudioSermon | null> {
  console.log(`[AudioSermons] Fetching detail for sermon ${messageId}`);

  // Try WP REST API first
  const apiResult = await fetchDetailFromWpApi(messageId);
  if (apiResult) {
    console.log(
      `[AudioSermons] Successfully fetched sermon ${messageId} from API`,
    );
    return apiResult;
  }

  console.log(
    `[AudioSermons] API failed, falling back to scraping for sermon ${messageId}`,
  );

  // Fall back to scraping
  const scrapedResult = await fetchDetailFromScraping(messageId);
  if (scrapedResult) {
    console.log(
      `[AudioSermons] Successfully fetched sermon ${messageId} via scraping`,
    );
    return scrapedResult;
  }

  console.log(
    `[AudioSermons] Scraping failed, searching recent sermons for sermon ${messageId}`,
  );

  // Last resort: search recent sermons (minimal API impact)
  const recentResult = await searchRecentSermons(messageId);
  if (recentResult) {
    return recentResult;
  }

  console.error(
    `[AudioSermons] All fetch methods failed for sermon ${messageId}. Creating minimal object with playable URL.`,
  );

  // Final fallback: Return a minimal sermon object with a playableURL
  // The Series Engine player can work with just the ID and listen URL
  return {
    id: messageId,
    title: `Message #${messageId}`,
    speaker: "",
    date: "",
    listenUrl: `${AUDIO_MESSAGES_URL}?enmse=1&enmse_am=1&enmse_mid=${messageId}&enmse_av=1`,
    downloadUrl: undefined,
    thumbnailUrl: undefined,
    series: undefined,
  };
}

// =============================================================================
// FILTER OPTIONS (Series, Speakers, Topics)
// =============================================================================

/**
 * Fetch all series/categories for the filter dropdown
 */
export async function getSeriesList(): Promise<SeriesItem[]> {
  try {
    const response = await deduplicatedFetch(
      `${WP_API_URL}/sermons/series`,
      getFetchOptions(),
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map((item: Record<string, unknown>) => ({
      id: item.id as number,
      title: item.title as string,
      description: item.description as string,
      thumbnail:
        fixThumbnailUrl(item.thumbnail as string) || (item.thumbnail as string),
      messageCount: item.messageCount as number,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch all speakers for the filter dropdown
 */
export async function getSpeakersList(): Promise<SpeakerItem[]> {
  try {
    const response = await deduplicatedFetch(
      `${WP_API_URL}/sermons/speakers`,
      getFetchOptions(),
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map((item: Record<string, unknown>) => ({
      id: item.id as number,
      name: item.name as string,
      messageCount: item.messageCount as number,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch all topics for the filter dropdown
 */
export async function getTopicsList(): Promise<TopicItem[]> {
  try {
    const response = await deduplicatedFetch(
      `${WP_API_URL}/sermons/topics`,
      getFetchOptions(),
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map((item: Record<string, unknown>) => ({
      id: item.id as number,
      name: item.name as string,
      messageCount: item.messageCount as number,
    }));
  } catch {
    return [];
  }
}
