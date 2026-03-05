import { NextRequest, NextResponse } from "next/server";
import {
  getSundayMessageTranscripts,
  getSundaySchoolManuals,
  getSundaySchoolTranscripts,
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
        // Fetch both sunday message and sunday school transcripts
        const [msgResult, ssResult] = await Promise.all([
          getSundayMessageTranscripts({
            page,
            perPage: Math.ceil(perPage / 2),
          }),
          getSundaySchoolTranscripts({
            page,
            perPage: Math.floor(perPage / 2),
          }),
        ]);

        const allTranscripts = [
          ...msgResult.transcripts.map((t) => ({
            id: t.id,
            title: t.title,
            date: t.formattedDate,
            status: "publish",
            speaker: t.speaker,
            type: "transcript" as const,
            transcriptType: t.type,
            excerpt: t.excerpt,
            slug: t.slug,
          })),
          ...ssResult.transcripts.map((t) => ({
            id: t.id,
            title: t.title,
            date: t.formattedDate,
            status: "publish",
            speaker: t.speaker,
            type: "transcript" as const,
            transcriptType: t.type,
            excerpt: t.excerpt,
            slug: t.slug,
          })),
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
        const result = await getSundaySchoolManuals({ page, perPage });
        return NextResponse.json({
          items: result.manuals.map((m) => ({
            id: m.id,
            title: m.title,
            date: m.formattedDate,
            status: "publish",
            type: "manual" as const,
            excerpt: m.excerpt,
            slug: m.slug,
            thumbnail: m.thumbnail,
          })),
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
