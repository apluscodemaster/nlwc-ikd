import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret } from "@/lib/auth";
import {
  TARGETS_BY_TYPE,
  revalidateTargets,
  type RevalidateTarget,
} from "@/lib/revalidateTargets";
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

type Target = RevalidateTarget;

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

  const revalidated = revalidateTargets(targets);

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
