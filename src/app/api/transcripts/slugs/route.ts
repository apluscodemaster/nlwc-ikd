import { NextResponse } from "next/server";

const WP_API =
  process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikdadmin.nlwc.church";
const CATEGORY_ID = 20; // Sunday Message Transcripts
const MAX_PAGES = 5;
const PER_PAGE = 100;

export async function GET() {
  try {
    const allTranscripts: {
      slug: string;
      title: string;
      id: number;
      categories: number[];
    }[] = [];
    let totalPages = MAX_PAGES;

    for (let page = 1; page <= totalPages; page++) {
      const url = `${WP_API}/wp-json/wp/v2/posts?categories=${CATEGORY_ID}&per_page=${PER_PAGE}&page=${page}&_fields=title,slug,id,categories&orderby=date&order=desc`;

      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

      if (!res.ok) {
        console.warn(`[TranscriptSlugs] Page ${page} failed: ${res.status}`);
        break;
      }

      const wpTotalPages = res.headers.get("X-WP-TotalPages");
      if (wpTotalPages) {
        totalPages = Math.min(
          parseInt(wpTotalPages, 10) || MAX_PAGES,
          MAX_PAGES,
        );
      }

      const posts: {
        title: { rendered: string };
        slug: string;
        id: number;
        categories: number[];
      }[] = await res.json();

      if (posts.length === 0) break;

      allTranscripts.push(
        ...posts.map((p) => ({
          slug: p.slug,
          title: p.title.rendered,
          id: p.id,
          categories: p.categories,
        })),
      );
    }

    return NextResponse.json(allTranscripts, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[TranscriptSlugs] Failed:", error);
    return NextResponse.json([], { status: 500 });
  }
}
