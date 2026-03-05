/**
 * WordPress REST API Client
 * Fetches content from the NLWC Ikorodu WordPress backend
 */

const WP_API_BASE = `${process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikorodu.nlwc.church"}/wp-json/wp/v2`;

import { sanitizeWPText, sanitizeWPHtml } from "@/utils/sanitizeWP";

// WordPress Category IDs
export const WP_CATEGORIES = {
  SUNDAY_MESSAGE_TRANSCRIPTS: 20,
  SUNDAY_SCHOOL_MANUAL: 19,
  SUNDAY_SCHOOL_TRANSCRIPTS: 31,
  SEASON_OF_THE_SPIRIT: 22,
  POST: 21,
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: WPAuthor[];
    "wp:featuredmedia"?: WPMedia[];
    "wp:term"?: WPTerm[][];
  };
}

export interface WPAuthor {
  id: number;
  name: string;
  slug: string;
  avatar_urls?: {
    "24"?: string;
    "48"?: string;
    "96"?: string;
  };
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text: string;
  media_details?: {
    width: number;
    height: number;
    sizes?: {
      thumbnail?: { source_url: string };
      medium?: { source_url: string };
      large?: { source_url: string };
      full?: { source_url: string };
    };
  };
}

export interface WPTerm {
  id: number;
  name: string;
  slug: string;
  taxonomy: string;
}

export interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
}

// Transformed types for frontend use
export interface TranscriptPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  formattedDate: string;
  slug: string;
  link: string;
  speaker?: string;
  thumbnail?: string;
  categories: string[];
  type: "sunday-message" | "sunday-school";
}

export interface SundaySchoolManual {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  formattedDate: string;
  slug: string;
  link: string;
  thumbnail?: string;
}

// =============================================================================
// FETCH UTILITIES
// =============================================================================

interface FetchPostsOptions {
  categories?: number[];
  perPage?: number;
  page?: number;
  search?: string;
  orderBy?: "date" | "title" | "id" | "modified";
  order?: "asc" | "desc";
  embed?: boolean;
  before?: string; // ISO date string — posts published before this date
  after?: string; // ISO date string — posts published after this date
  exclude?: number[]; // Post IDs to exclude
}

/**
 * Fetch posts from WordPress with optional filtering
 */
export async function fetchWPPosts(
  options: FetchPostsOptions = {},
): Promise<{ posts: WPPost[]; totalPages: number; total: number }> {
  const {
    categories,
    perPage = 10,
    page = 1,
    search,
    orderBy = "date",
    order = "desc",
    embed = true,
  } = options;

  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString(),
    orderby: orderBy,
    order,
  });

  if (categories && categories.length > 0) {
    params.append("categories", categories.join(","));
  }

  if (search) {
    params.append("search", search);
  }

  if (options.before) {
    params.append("before", options.before);
  }

  if (options.after) {
    params.append("after", options.after);
  }

  if (options.exclude && options.exclude.length > 0) {
    params.append("exclude", options.exclude.join(","));
  }

  if (embed) {
    params.append("_embed", "true");
  }

  let response: Response | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 3s
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }

    response = await fetch(`${WP_API_BASE}/posts?${params.toString()}`, {
      next: {
        revalidate: 300,
      },
    });

    if (response.ok) break;
    if (response.status === 429) {
      lastError = new Error(`Rate limited (attempt ${attempt + 1})`);
      continue;
    }
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }

  if (!response || !response.ok) {
    throw lastError || new Error("Failed to fetch posts after retries");
  }

  const posts: WPPost[] = await response.json();
  const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1");
  const total = parseInt(response.headers.get("X-WP-Total") || "0");

  return { posts, totalPages, total };
}

/**
 * Fetch a single post by ID or slug
 */
export async function fetchWPPost(
  idOrSlug: number | string,
  embed = true,
): Promise<WPPost | null> {
  const isId = typeof idOrSlug === "number";
  const endpoint = isId
    ? `${WP_API_BASE}/posts/${idOrSlug}`
    : `${WP_API_BASE}/posts?slug=${idOrSlug}`;

  const params = embed ? "?_embed=true" : "";
  const url = isId ? `${endpoint}${params}` : `${endpoint}&_embed=true`;

  let response: Response | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }

    response = await fetch(url, {
      next: {
        revalidate: 300,
      },
    });

    if (response.ok) break;
    if (response.status === 404) return null;
    if (response.status === 429) {
      lastError = new Error(`Rate limited (attempt ${attempt + 1})`);
      continue;
    }
    throw new Error(`Failed to fetch post: ${response.statusText}`);
  }

  if (!response || !response.ok) {
    throw lastError || new Error("Failed to fetch post after retries");
  }

  const data = await response.json();
  return isId ? data : data[0] || null;
}

/**
 * Fetch all categories
 */
export async function fetchWPCategories(): Promise<WPCategory[]> {
  const response = await fetch(`${WP_API_BASE}/categories?per_page=100`, {
    next: {
      revalidate: 3600, // Cache for 1 hour
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

// WordPress Custom Post Type endpoints
export const WP_CUSTOM_POST_TYPES = {
  MESSAGE_TRANSCRIPTS: "message-transcripts",
  SUNDAY_SCHOOL_MANUAL: "sunday-school-manual",
} as const;

interface FetchCustomPostTypeOptions {
  perPage?: number;
  page?: number;
  search?: string;
  orderBy?: "date" | "title" | "id" | "modified";
  order?: "asc" | "desc";
  embed?: boolean;
}

/**
 * Fetch from a custom post type endpoint
 */
export async function fetchCustomPostType(
  postType: string,
  options: FetchCustomPostTypeOptions = {},
): Promise<{ posts: WPPost[]; totalPages: number; total: number }> {
  const {
    perPage = 10,
    page = 1,
    search,
    orderBy = "date",
    order = "desc",
    embed = true,
  } = options;

  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString(),
    orderby: orderBy,
    order,
  });

  if (search) {
    params.append("search", search);
  }

  if (embed) {
    params.append("_embed", "true");
  }

  const response = await fetch(
    `${WP_API_BASE}/${postType}?${params.toString()}`,
    {
      next: {
        revalidate: 300,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${postType}: ${response.statusText}`);
  }

  const posts: WPPost[] = await response.json();
  const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1");
  const total = parseInt(response.headers.get("X-WP-Total") || "0");

  return { posts, totalPages, total };
}

/**
 * Fetch a single item from a custom post type by slug
 */
export async function fetchCustomPostTypeBySlug(
  postType: string,
  slug: string,
  embed = true,
): Promise<WPPost | null> {
  const params = new URLSearchParams({ slug });
  if (embed) {
    params.append("_embed", "true");
  }

  const response = await fetch(
    `${WP_API_BASE}/${postType}?${params.toString()}`,
    {
      next: {
        revalidate: 300,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch ${postType}: ${response.statusText}`);
  }

  const data = await response.json();
  return data[0] || null;
}

// =============================================================================
// DATA TRANSFORMERS
// =============================================================================

/**
 * Extract speaker name from post content (commonly formatted as "Minister: Pastor Name")
 */
function extractSpeaker(content: string): string | undefined {
  // Try to find patterns like "Minister: Pastor Name" or "Speaker: Name"
  const patterns = [
    /Minister\(?s?\)?:\s*(?:<[^>]*>)*\s*([^<\n]+)/i,
    /Speaker:\s*(?:<[^>]*>)*\s*([^<\n]+)/i,
    /Pastor\s+([A-Z][a-z]+\s*[A-Z]?[a-z]*)/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/<[^>]*>/g, "");
    }
  }

  return undefined;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get featured image URL from embedded data
 */
function getFeaturedImage(post: WPPost): string | undefined {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return undefined;

  // Prefer medium size for thumbnails
  return (
    media.media_details?.sizes?.medium?.source_url ||
    media.media_details?.sizes?.large?.source_url ||
    media.source_url
  );
}

/**
 * Get category names from embedded data
 */
function getCategoryNames(post: WPPost): string[] {
  const terms = post._embedded?.["wp:term"];
  if (!terms) return [];

  const categories = terms
    .flat()
    .filter((term) => term.taxonomy === "category");
  return categories.map((cat) => cat.name);
}

/**
 * Transform WP post to Transcript format
 */
export function transformToTranscript(post: WPPost): TranscriptPost {
  const isSundaySchool = post.categories.includes(
    WP_CATEGORIES.SUNDAY_SCHOOL_TRANSCRIPTS,
  );

  return {
    id: post.id,
    title: sanitizeWPText(post.title.rendered),
    content: sanitizeWPHtml(post.content.rendered),
    excerpt: sanitizeWPText(post.excerpt.rendered.replace(/<[^>]*>/g, "")),
    date: post.date,
    formattedDate: formatDate(post.date),
    slug: post.slug,
    link: post.link,
    speaker: extractSpeaker(post.content.rendered),
    thumbnail: getFeaturedImage(post),
    categories: getCategoryNames(post),
    type: isSundaySchool ? "sunday-school" : "sunday-message",
  };
}

/**
 * Transform WP post to Sunday School Manual format
 */
export function transformToManual(post: WPPost): SundaySchoolManual {
  return {
    id: post.id,
    title: sanitizeWPText(post.title.rendered),
    content: sanitizeWPHtml(post.content.rendered),
    excerpt: sanitizeWPText(post.excerpt.rendered.replace(/<[^>]*>/g, "")),
    date: post.date,
    formattedDate: formatDate(post.date),
    slug: post.slug,
    link: post.link,
    thumbnail: getFeaturedImage(post) || undefined,
  };
}

// =============================================================================
// HIGH-LEVEL API FUNCTIONS
// =============================================================================

/**
 * Get Sunday Message Transcripts
 */
export async function getSundayMessageTranscripts(
  options: { page?: number; perPage?: number; search?: string } = {},
) {
  const { posts, totalPages, total } = await fetchWPPosts({
    categories: [WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS],
    page: options.page || 1,
    perPage: options.perPage || 10,
    search: options.search,
  });

  return {
    transcripts: posts.map(transformToTranscript),
    totalPages,
    total,
  };
}

/**
 * Get Sunday School Manuals
 */
export async function getSundaySchoolManuals(
  options: { page?: number; perPage?: number; search?: string } = {},
) {
  const { posts, totalPages, total } = await fetchWPPosts({
    categories: [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL],
    page: options.page || 1,
    perPage: options.perPage || 10,
    search: options.search,
  });

  return {
    manuals: posts.map(transformToManual),
    totalPages,
    total,
  };
}

/**
 * Get adjacent manuals (previous and next) by date
 */
export async function getAdjacentManuals(
  currentDate: string,
  currentSlug: string,
): Promise<{
  previous: { title: string; slug: string } | null;
  next: { title: string; slug: string } | null;
}> {
  try {
    // Fetch 1 manual published BEFORE the current date (newer → older = desc)
    const { posts: olderPosts } = await fetchWPPosts({
      categories: [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL],
      perPage: 2,
      page: 1,
      orderBy: "date",
      order: "desc",
      before: currentDate,
      embed: false,
    });

    // Fetch 1 manual published AFTER the current date (older → newer = asc)
    const { posts: newerPosts } = await fetchWPPosts({
      categories: [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL],
      perPage: 2,
      page: 1,
      orderBy: "date",
      order: "asc",
      after: currentDate,
      embed: false,
    });

    // Filter out the current post by slug
    const prevPost = olderPosts.find((p) => p.slug !== currentSlug) || null;
    const nextPost = newerPosts.find((p) => p.slug !== currentSlug) || null;

    return {
      previous: prevPost
        ? {
            title: sanitizeWPText(prevPost.title.rendered),
            slug: prevPost.slug,
          }
        : null,
      next: nextPost
        ? {
            title: sanitizeWPText(nextPost.title.rendered),
            slug: nextPost.slug,
          }
        : null,
    };
  } catch (error) {
    console.error("Failed to fetch adjacent manuals:", error);
    return { previous: null, next: null };
  }
}

/**
 * Get Sunday School Transcripts
 */
export async function getSundaySchoolTranscripts(
  options: { page?: number; perPage?: number; search?: string } = {},
) {
  const { posts, totalPages, total } = await fetchWPPosts({
    categories: [WP_CATEGORIES.SUNDAY_SCHOOL_TRANSCRIPTS],
    page: options.page || 1,
    perPage: options.perPage || 10,
    search: options.search,
  });

  return {
    transcripts: posts.map(transformToTranscript),
    totalPages,
    total,
  };
}

/**
 * Get all content (messages + manuals) for homepage/featured section
 */
export async function getFeaturedContent(limit = 6) {
  const [messageTranscripts, manuals] = await Promise.all([
    getSundayMessageTranscripts({ perPage: limit }),
    getSundaySchoolManuals({ perPage: limit }),
  ]);

  return {
    latestMessages: messageTranscripts.transcripts.slice(0, limit),
    latestManuals: manuals.manuals.slice(0, limit),
  };
}

/**
 * Get a single transcript by slug
 */
export async function getTranscriptBySlug(
  slug: string,
): Promise<TranscriptPost | null> {
  const post = await fetchWPPost(slug);
  if (!post) return null;
  return transformToTranscript(post);
}

/**
 * Get a single manual by slug
 */
export async function getManualBySlug(
  slug: string,
): Promise<SundaySchoolManual | null> {
  const post = await fetchWPPost(slug);
  if (!post) return null;
  return transformToManual(post);
}

// =============================================================================
// CUSTOM POST TYPE API FUNCTIONS (SERMONS/MESSAGE TRANSCRIPTS)
// =============================================================================

/**
 * Get Message Transcripts from custom post type endpoint
 * This fetches from the dedicated message-transcripts CPT
 */
export async function getMessageTranscripts(
  options: { page?: number; perPage?: number; search?: string } = {},
) {
  const { posts, totalPages, total } = await fetchCustomPostType(
    WP_CUSTOM_POST_TYPES.MESSAGE_TRANSCRIPTS,
    {
      page: options.page || 1,
      perPage: options.perPage || 10,
      search: options.search,
    },
  );

  return {
    transcripts: posts.map(transformToTranscript),
    totalPages,
    total,
  };
}

/**
 * Get a single message transcript by slug from custom post type
 */
export async function getMessageTranscriptBySlug(
  slug: string,
): Promise<TranscriptPost | null> {
  const post = await fetchCustomPostTypeBySlug(
    WP_CUSTOM_POST_TYPES.MESSAGE_TRANSCRIPTS,
    slug,
  );
  if (!post) return null;
  return transformToTranscript(post);
}

/**
 * Get Sunday School Manuals from custom post type endpoint
 */
export async function getSundaySchoolManualsFromCPT(
  options: { page?: number; perPage?: number; search?: string } = {},
) {
  const { posts, totalPages, total } = await fetchCustomPostType(
    WP_CUSTOM_POST_TYPES.SUNDAY_SCHOOL_MANUAL,
    {
      page: options.page || 1,
      perPage: options.perPage || 10,
      search: options.search,
    },
  );

  return {
    manuals: posts.map(transformToManual),
    totalPages,
    total,
  };
}

/**
 * Get a single Sunday School manual by slug from custom post type
 */
export async function getManualBySlugFromCPT(
  slug: string,
): Promise<SundaySchoolManual | null> {
  const post = await fetchCustomPostTypeBySlug(
    WP_CUSTOM_POST_TYPES.SUNDAY_SCHOOL_MANUAL,
    slug,
  );
  if (!post) return null;
  return transformToManual(post);
}
