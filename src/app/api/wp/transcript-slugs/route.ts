import { NextResponse } from "next/server";

/**
 * GET /api/wp/transcript-slugs
 *
 * Returns lightweight transcript stubs (title + slug) used to match audio
 * sermons to their transcripts on the sermons page.
 *
 * Cached for an hour: WordPress is queried at most once per hour regardless of
 * how many visitors load the sermons page (previously every visitor fetched
 * the full transcript list directly from WordPress).
 */
export const revalidate = 3600;

const WP_API =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";
const CATEGORY_ID = 20; // Sunday Message Transcripts
const PER_PAGE = 100;
// Safety bound; the real page count comes from WordPress's X-WP-TotalPages.
const MAX_PAGES = 30;

type WPTranscriptPost = {
  title: { rendered: string };
  slug: string;
  id: number;
  categories: number[];
};

const buildUrl = (page: number) =>
  `${WP_API}/wp-json/wp/v2/posts?categories=${CATEGORY_ID}&per_page=${PER_PAGE}&page=${page}&_fields=title,slug,id,categories&orderby=date&order=desc`;

// Each WP fetch is itself cached for an hour, so even if this handler re-runs
// it serves from the Data Cache instead of hitting WordPress.
const fetchPage = (page: number) =>
  fetch(buildUrl(page), { next: { revalidate: 3600 } });

export async function GET() {
  try {
    const firstRes = await fetchPage(1);
    if (!firstRes.ok) {
      return NextResponse.json({ items: [] });
    }

    const firstPosts: WPTranscriptPost[] = await firstRes.json();
    const posts: WPTranscriptPost[] = [...firstPosts];

    const wpTotalPages =
      parseInt(firstRes.headers.get("X-WP-TotalPages") || "1", 10) || 1;
    const lastPage = Math.min(wpTotalPages, MAX_PAGES);

    if (lastPage > 1) {
      const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) =>
          fetchPage(i + 2)
            .then((r) => (r.ok ? (r.json() as Promise<WPTranscriptPost[]>) : []))
            .catch(() => [] as WPTranscriptPost[]),
        ),
      );
      for (const pagePosts of rest) posts.push(...pagePosts);
    }

    return NextResponse.json({
      items: posts.map((p) => ({
        slug: p.slug,
        title: p.title.rendered,
        id: p.id,
        categories: p.categories,
      })),
    });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
