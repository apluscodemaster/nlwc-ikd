import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { requireAuthActor } from "@/lib/auth";
import {
  WP_CATEGORIES,
  fetchWPPosts,
  getTranscriptCategories,
  transformToTranscript,
  transformToManual,
  extractSpeaker,
} from "@/lib/wordpress";
import { getAudioSermons } from "@/lib/audioSermons";

// Always run fresh (never serve a cached response) and on the Node runtime
// (Buffer is used to build the WP Basic-auth header).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const res = await handleGet(request);
  // `dynamic = "force-dynamic"` only stops Next from caching this on the
  // server — it sends no Cache-Control, which leaves the BROWSER free to reuse
  // a previous response heuristically. That is how the admin list kept showing
  // pre-edit values (a stale transcript type, say) after WordPress had already
  // been updated. Admin reads must always be fresh.
  res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return res;
}

async function handleGet(request: NextRequest): Promise<NextResponse> {
  // Admin only: this reads WordPress with the admin application password and
  // includes drafts, scheduled and pending posts. It used to be public, which
  // let anyone list unpublished content.
  const auth = await requireAuthActor(request);
  if (auth.response) return auth.response;

  // Rate limited: proxies WordPress.
  const limited = await rateLimitMiddleware(request, "authenticated");
  if (limited) return limited;

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "sermon";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "6");
  const search = searchParams.get("search")?.trim() || undefined;

  // When credentials exist, include unpublished statuses so newly created
  // drafts/scheduled posts appear in the admin list. Without creds we fall
  // back to published-only (the public behaviour).
  const authHeader = getAdminAuth();
  const adminStatus = authHeader ? "publish,future,draft,pending" : undefined;

  // Set when WordPress refused the admin login and the list fell back to
  // published posts only; returned so the admin sees why drafts are missing.
  let warning: string | undefined;

  /**
   * WordPress posts for the admin list, including drafts/scheduled when the
   * admin login works. If WordPress rejects that login it answers 400
   * "Status is forbidden" for the unpublished statuses — then fall back to
   * the published posts rather than failing the whole list.
   */
  const fetchAdminPosts = async (
    opts: Omit<Parameters<typeof fetchWPPosts>[0], "status" | "authHeader">,
  ) => {
    try {
      return await fetchWPPosts({ ...opts, status: adminStatus, authHeader });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!adminStatus || !/rest_forbidden_status|returned 40[01]|Bad Request/.test(message)) {
        throw err;
      }
      console.error(
        "WordPress rejected the admin login (WP_APPLICATION_USER / WP_APPLICATION_PASSWORD) — listing published posts only:",
        message,
      );
      warning =
        "WordPress rejected the site's admin login, so drafts and scheduled posts are hidden and publishing/editing may fail. Check WP_APPLICATION_USER and WP_APPLICATION_PASSWORD in Vercel.";
      return await fetchWPPosts(opts);
    }
  };

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
            // The edit modal prefills its Description box from `content`.
            // Without this it opened empty and the save wrote that emptiness
            // back, wiping the stored description.
            content: s.description,
            excerpt: s.description,
          })),
          pagination: result.pagination,
        });
      }

      case "transcript": {
        // One query across all transcript categories (fewer API calls), with
        // unpublished statuses so drafts/scheduled transcripts also appear.
        // Read fresh so a category added moments ago is already included.
        const transcriptCategories = await getTranscriptCategories(true);
        const categoryNames = new Map(
          transcriptCategories.map((c) => [c.id, c.name]),
        );
        const result = await fetchAdminPosts({
          categories: transcriptCategories.map((c) => c.id),
          page,
          perPage,
          search,
          noStore: true,
          // Admin list shows no thumbnail for transcripts — skip _embed to
          // lighten the WP query and response.
          embed: false,
        });

        return NextResponse.json({
          items: result.posts.map((post) => {
            const transcript = transformToTranscript(post);
            return {
              id: transcript.id,
              title: transcript.title,
              date: transcript.formattedDate,
              // Raw WP timestamp (naive, site-local "YYYY-MM-DDTHH:mm:ss").
              // `date` above is a display label with no time, so the edit form
              // needs this to round-trip the scheduled hour/minute.
              dateIso: post.date,
              status: post.status,
              speaker: transcript.speaker,
              type: "transcript" as const,
              transcriptType: transcript.type,
              transcriptCategoryId: transcript.categoryId,
              transcriptCategory:
                transcript.categoryId !== undefined
                  ? categoryNames.get(transcript.categoryId)
                  : undefined,
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
          ...(warning ? { warning } : {}),
        });
      }

      case "manual": {
        const result = await fetchAdminPosts({
          categories: [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL],
          page,
          perPage,
          search,
          noStore: true,
          embed: false,
        });

        return NextResponse.json({
          items: result.posts.map((post) => {
            const manual = transformToManual(post);
            return {
              id: manual.id,
              title: manual.title,
              date: manual.formattedDate,
              // See the transcript branch — carries the time the display label drops.
              dateIso: post.date,
              status: post.status,
              speaker: extractSpeaker(post.content.rendered),
              type: "manual" as const,
              content: manual.content,
              excerpt: manual.excerpt,
              slug: manual.slug,
              thumbnail: manual.thumbnail,
              theme: manual.theme,
              lesson: manual.lesson,
            };
          }),
          pagination: {
            page,
            perPage,
            total: result.total,
            totalPages: result.totalPages,
          },
          ...(warning ? { warning } : {}),
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
    // Admin-only route, so the underlying reason (e.g. what WordPress
    // answered) is safe to return — the list's error toast shows it.
    return NextResponse.json(
      {
        error: `Failed to fetch ${type} content: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 502 },
    );
  }
}
