import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyWebhookSecret } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";

/**
 * On-demand revalidation endpoint (webhook target)
 *
 * Called by WordPress (see wordpress/mu-plugins/nlwc-nextjs-revalidate.php) the
 * moment a transcript / manual / sermon is published or updated, so the change
 * appears within seconds instead of waiting for the time-based cache window.
 *
 * Cost is minimal: revalidatePath() only *marks* the cached entries stale — the
 * actual WordPress refetch happens lazily on the next visitor request, exactly
 * once. WordPress is never polled.
 *
 * Usage:
 *   POST /api/revalidate?type=transcript        (revalidates the whole bundle)
 *   POST /api/revalidate?path=/transcripts      (revalidate a single path)
 *   Header: Authorization: Bearer <WEBHOOK_SECRET>
 */

type Target = { path: string; kind?: "page" | "layout" };

// The set of cached surfaces affected by each content type. Detail routes use
// the "[slug]"/"[id]" form so every cached detail page is refreshed.
const TARGETS_BY_TYPE: Record<string, Target[]> = {
  transcript: [
    { path: "/transcripts" },
    { path: "/transcripts/[slug]", kind: "page" },
    { path: "/sermons" }, // sermon ↔ transcript matching surface
    { path: "/api/wp/transcript-slugs" }, // cached matching data
  ],
  manual: [
    { path: "/manuals" },
    { path: "/manuals/[slug]", kind: "page" },
  ],
  sermon: [
    { path: "/sermons" },
    { path: "/sermons/audio/[id]", kind: "page" },
  ],
};

export async function POST(request: NextRequest) {
  // Strict rate limiting (this is a webhook, not a high-frequency endpoint).
  const rateLimitError = rateLimitMiddleware(request, "strict");
  if (rateLimitError) return rateLimitError;

  // Verify the shared secret (Authorization: Bearer <WEBHOOK_SECRET>).
  const secretCheck = verifyWebhookSecret(request);
  if (!secretCheck.isValid) {
    return NextResponse.json(
      { error: secretCheck.error || "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const path = searchParams.get("path");

  if (!type && !path) {
    return NextResponse.json(
      { error: "Provide a 'type' (transcript|manual|sermon) or a 'path'." },
      { status: 400 },
    );
  }

  const targets: Target[] = [];
  if (type) {
    const mapped = TARGETS_BY_TYPE[type];
    if (!mapped) {
      return NextResponse.json(
        { error: `Unknown type: ${type}` },
        { status: 400 },
      );
    }
    targets.push(...mapped);
  }
  if (path) targets.push({ path });

  const revalidated: string[] = [];
  for (const t of targets) {
    try {
      if (t.kind) revalidatePath(t.path, t.kind);
      else revalidatePath(t.path);
      revalidated.push(t.path);
    } catch (err) {
      // A single path failing (e.g. under Turbopack in dev) must not fail the
      // whole webhook — keep going.
      console.warn(`[Revalidate] Failed for ${t.path}:`, err);
    }
  }

  console.log(`[Revalidate] type=${type ?? "-"} →`, revalidated.join(", "));
  return NextResponse.json({ message: "Revalidation triggered", revalidated });
}

/**
 * GET /api/revalidate?check=true — health check.
 */
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("check") === "true") {
    return NextResponse.json({
      status: "healthy",
      usage:
        "POST /api/revalidate?type=transcript|manual|sermon (or ?path=/...) with Authorization: Bearer <WEBHOOK_SECRET>",
      types: Object.keys(TARGETS_BY_TYPE),
    });
  }
  return NextResponse.json(
    { error: "Use POST to revalidate, or GET ?check=true for health." },
    { status: 405 },
  );
}
