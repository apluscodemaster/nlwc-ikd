import { NextRequest, NextResponse } from "next/server";
import {
  WP_CATEGORIES,
  fetchWPPosts,
  transformToTranscript,
  transformToManual,
  extractSpeaker,
} from "@/lib/wordpress";
import { getAudioSermons } from "@/lib/audioSermons";

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

  try {
    switch (type) {
      case "sermon": {
        const result = await getAudioSermons({ page, perPage });
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
        // Fetch both sunday message and sunday school transcripts with full content
        const [msgResult, ssResult] = await Promise.all([
          fetchWPPosts({
            categories: [WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS],
            page,
            perPage: Math.ceil(perPage / 2),
          }),
          fetchWPPosts({
            categories: [WP_CATEGORIES.SUNDAY_SCHOOL_TRANSCRIPTS],
            page,
            perPage: Math.floor(perPage / 2),
          }),
        ]);

        const allTranscripts = [
          ...msgResult.posts.map((post) => {
            const transcript = transformToTranscript(post);
            return {
              id: transcript.id,
              title: transcript.title,
              date: transcript.formattedDate,
              status: "publish",
              speaker: transcript.speaker,
              type: "transcript" as const,
              transcriptType: transcript.type,
              content: transcript.content,
              excerpt: transcript.excerpt,
              slug: transcript.slug,
            };
          }),
          ...ssResult.posts.map((post) => {
            const transcript = transformToTranscript(post);
            return {
              id: transcript.id,
              title: transcript.title,
              date: transcript.formattedDate,
              status: "publish",
              speaker: transcript.speaker,
              type: "transcript" as const,
              transcriptType: transcript.type,
              content: transcript.content,
              excerpt: transcript.excerpt,
              slug: transcript.slug,
            };
          }),
        ].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        return NextResponse.json({
          items: allTranscripts.slice(0, perPage),
          pagination: {
            page,
            perPage,
            total: msgResult.total + ssResult.total,
            totalPages: Math.max(msgResult.totalPages, ssResult.totalPages),
          },
        });
      }

      case "manual": {
        const result = await fetchWPPosts({
          categories: [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL],
          page,
          perPage,
        });

        return NextResponse.json({
          items: result.posts.map((post) => {
            const manual = transformToManual(post);
            return {
              id: manual.id,
              title: manual.title,
              date: manual.formattedDate,
              status: "publish",
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
