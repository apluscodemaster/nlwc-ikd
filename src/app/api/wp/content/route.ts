import { NextRequest, NextResponse } from "next/server";
import {
  WP_CATEGORIES,
  fetchWPPosts,
  transformToTranscript,
  transformToManual,
  extractSpeaker,
} from "@/lib/wordpress";
import { getAudioSermons } from "@/lib/audioSermons";

// All five transcript categories, so the admin list shows every transcript
// type (not just Sunday Message + Sunday School).
const ALL_TRANSCRIPT_CATEGORIES = [
  WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS,
  WP_CATEGORIES.SUNDAY_SCHOOL_TRANSCRIPTS,
  WP_CATEGORIES.BIBLE_STUDY_TRANSCRIPTS,
  WP_CATEGORIES.OTHER_MEETINGS,
  WP_CATEGORIES.SEASON_OF_THE_SPIRIT,
];

/** Basic-auth header so the admin list can read drafts/scheduled posts. */
function getAdminAuth(): string | undefined {
  const user = process.env.WP_APPLICATION_USER || "admin";
  const pass = process.env.WP_APPLICATION_PASSWORD || "";
  if (!pass) return undefined;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

/**
 * GET /api/wp/content?type=sermon|transcript|manual&page=1&per_page=6
 *
 * Fetches existing WordPress content for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "sermon";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "6");
  const search = searchParams.get("search")?.trim() || undefined;

  // When credentials exist, include unpublished statuses so newly created
  // drafts/scheduled posts appear in the admin list. Without creds we fall
  // back to published-only (the public behaviour).
  const authHeader = getAdminAuth();
  const adminStatus = authHeader
    ? "publish,future,draft,pending"
    : undefined;

  try {
    switch (type) {
      case "sermon": {
        // Admin view: bypass caches so freshly-saved edits appear immediately.
        const result = await getAudioSermons({
          page,
          perPage,
          noStore: true,
          search,
        });
        return NextResponse.json({
          items: result.data.map((s) => ({
            id: s.id,
            title: s.title,
            date: s.date,
            status: "publish",
            speaker: s.speaker,
            type: "sermon" as const,
            audioUrl: s.downloadUrl || s.listenUrl,
            thumbnail: s.thumbnailUrl,
            series: s.series,
          })),
          pagination: result.pagination,
        });
      }

      case "transcript": {
        // One query across all transcript categories (fewer API calls), with
        // unpublished statuses so drafts/scheduled transcripts also appear.
        const result = await fetchWPPosts({
          categories: ALL_TRANSCRIPT_CATEGORIES,
          page,
          perPage,
          search,
          status: adminStatus,
          authHeader,
          noStore: true,
        });

        return NextResponse.json({
          items: result.posts.map((post) => {
            const transcript = transformToTranscript(post);
            return {
              id: transcript.id,
              title: transcript.title,
              date: transcript.formattedDate,
              status: post.status,
              speaker: transcript.speaker,
              type: "transcript" as const,
              transcriptType: transcript.type,
              content: transcript.content,
              excerpt: transcript.excerpt,
              slug: transcript.slug,
            };
          }),
          pagination: {
            page,
            perPage,
            total: result.total,
            totalPages: result.totalPages,
          },
        });
      }

      case "manual": {
        const result = await fetchWPPosts({
          categories: [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL],
          page,
          perPage,
          search,
          status: adminStatus,
          authHeader,
          noStore: true,
        });

        return NextResponse.json({
          items: result.posts.map((post) => {
            const manual = transformToManual(post);
            return {
              id: manual.id,
              title: manual.title,
              date: manual.formattedDate,
              status: post.status,
              speaker: extractSpeaker(post.content.rendered),
              type: "manual" as const,
              content: manual.content,
              excerpt: manual.excerpt,
              slug: manual.slug,
              thumbnail: manual.thumbnail,
            };
          }),
          pagination: {
            page,
            perPage,
            total: result.total,
            totalPages: result.totalPages,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error(`Failed to fetch ${type} content:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${type} content` },
      { status: 500 },
    );
  }
}
