import { MetadataRoute } from "next";
import { fetchWPPosts, WP_CATEGORIES } from "@/lib/wordpress";

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

  const [transcripts, manuals] = await Promise.all([
    collectEntries(baseUrl, "/transcripts", TRANSCRIPT_CATEGORIES),
    collectEntries(baseUrl, "/manuals", [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL]),
  ]);

  return [...staticRoutes, ...transcripts, ...manuals];
}
