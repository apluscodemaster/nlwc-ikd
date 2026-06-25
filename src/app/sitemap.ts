import { MetadataRoute } from "next";
import { fetchWPPosts, WP_CATEGORIES } from "@/lib/wordpress";
import { getAudioSermons } from "@/lib/audioSermons";
import { getPublishedDevotionals } from "@/lib/devotionals";

// Regenerate the sitemap at most once a day, so WordPress is queried daily (not
// per crawler hit) when collecting transcript/manual URLs.
export const revalidate = 86400;

const TRANSCRIPT_CATEGORIES = [
  WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS,
  WP_CATEGORIES.SUNDAY_SCHOOL_TRANSCRIPTS,
  WP_CATEGORIES.BIBLE_STUDY_TRANSCRIPTS,
  WP_CATEGORIES.OTHER_MEETINGS,
  WP_CATEGORIES.SEASON_OF_THE_SPIRIT,
];

// Collect detail-page URLs for a set of WordPress categories. Bounded and
// wrapped in try/catch so the sitemap can never fail the build/request.
async function collectEntries(
  baseUrl: string,
  pathPrefix: string,
  categories: number[],
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const MAX_PAGES = 5; // safety cap (up to 500 items)
  try {
    let page = 1;
    let lastPage = 1;
    do {
      const { posts, totalPages } = await fetchWPPosts({
        categories,
        perPage: 100,
        page,
        embed: false,
      });
      lastPage = Math.min(totalPages || 1, MAX_PAGES);
      for (const post of posts) {
        if (!post.slug) continue;
        entries.push({
          url: `${baseUrl}${pathPrefix}/${post.slug}`,
          lastModified: post.modified ? new Date(post.modified) : new Date(),
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
      page += 1;
    } while (page <= lastPage);
  } catch {
    // Network/WP failure — return whatever was collected (possibly none).
  }
  return entries;
}

// Collect audio-message detail URLs from the Series Engine. Bounded and
// wrapped so the sitemap never fails if the sermon API is unavailable.
async function collectAudioSermons(
  baseUrl: string,
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const MAX_PAGES = 10; // safety cap (up to 500 items at 50/page)
  try {
    let page = 1;
    let lastPage = 1;
    do {
      const { data, pagination } = await getAudioSermons({ page, perPage: 50 });
      lastPage = Math.min(pagination.totalPages || 1, MAX_PAGES);
      for (const sermon of data) {
        if (!sermon.id) continue;
        const modified = sermon.date ? new Date(sermon.date) : new Date();
        entries.push({
          url: `${baseUrl}/sermons/audio/${sermon.id}`,
          lastModified: isNaN(modified.getTime()) ? new Date() : modified,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
      page += 1;
    } while (page <= lastPage);
  } catch {
    // Sermon API failure — return whatever was collected (possibly none).
  }
  return entries;
}

// Collect published daily-devotional detail URLs from Firestore. Paginated,
// bounded, and wrapped so the sitemap never fails if Firestore is unavailable.
async function collectDevotionals(
  baseUrl: string,
): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const PAGE_SIZE = 48;
  const MAX_PAGES = 12; // safety cap (up to ~576 items)
  try {
    let lastDoc: Parameters<typeof getPublishedDevotionals>[1] = undefined;
    for (let i = 0; i < MAX_PAGES; i++) {
      const { devotionals, lastVisible, hasMore } =
        await getPublishedDevotionals(PAGE_SIZE, lastDoc);
      for (const d of devotionals) {
        if (!d.id) continue;
        const dt =
          d.scheduledDate && typeof d.scheduledDate.toDate === "function"
            ? d.scheduledDate.toDate()
            : new Date();
        entries.push({
          url: `${baseUrl}/devotionals/${d.id}`,
          lastModified: isNaN(dt.getTime()) ? new Date() : dt,
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
      if (!hasMore || !lastVisible) break;
      lastDoc = lastVisible ?? undefined;
    }
  } catch {
    // Firestore failure — return whatever was collected (possibly none).
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://ikorodu.nlwc.church";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/fellowship`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/give`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/live`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/listen-live`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/media`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/sermons`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/sermons/quiz`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/video-messages`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/devotionals`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/manuals`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/transcripts`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/testimonies`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/salvation`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${baseUrl}/welcome`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const [transcripts, manuals, audioSermons, devotionals] = await Promise.all([
    collectEntries(baseUrl, "/transcripts", TRANSCRIPT_CATEGORIES),
    collectEntries(baseUrl, "/manuals", [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL]),
    collectAudioSermons(baseUrl),
    collectDevotionals(baseUrl),
  ]);

  return [
    ...staticRoutes,
    ...transcripts,
    ...manuals,
    ...audioSermons,
    ...devotionals,
  ];
}
