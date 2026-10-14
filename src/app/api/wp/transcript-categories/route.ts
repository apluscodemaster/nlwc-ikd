import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { requireAuthActor } from "@/lib/auth";
import { recordAudit } from "@/lib/auditLog";
import { getTranscriptCategories } from "@/lib/wordpress";
import { wpTranscriptCategoryCreateSchema } from "@/types/wp-types";
import { createTranscriptCategory } from "@/services/wp-service";

/**
 * GET /api/wp/transcript-categories[?fresh=1]
 *
 * Every transcript category (children of the WP "Transcripts" category), for
 * the admin category select and the public filter tabs. `fresh=1` skips the
 * caches — the admin uses it right after adding a category — and, as with
 * /api/wp/speakers, is only honoured for an authenticated caller.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimitMiddleware(request, "public");
  if (limited) return limited;

  let fresh = request.nextUrl.searchParams.get("fresh") === "1";
  if (fresh) {
    const auth = await requireAuthActor(request);
    if (auth.response) fresh = false;
  }

  const categories = await getTranscriptCategories(fresh);
  return NextResponse.json(
    { categories },
    {
      headers: fresh
        ? { "Cache-Control": "no-store" }
        : {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
    },
  );
}

/**
 * POST /api/wp/transcript-categories
 *
 * Body: `{ name }`. Creates the category in WordPress under "Transcripts" and
 * returns it in the GET shape. A duplicate returns 409 with the existing
 * category under `existing`, so the admin can just select that one.
 *
 * Requires: Authorization: Bearer <Firebase ID token>
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthActor(request);
  if (auth.response) return auth.response;

  const limited = rateLimitMiddleware(request, "authenticated");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = wpTranscriptCategoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || "Validation failed",
      },
      { status: 400 },
    );
  }

  const result = await createTranscriptCategory(parsed.data);

  if (!result.success) {
    void recordAudit({
      actor: auth.actor,
      action: "create",
      resource: "transcript-category",
      target: parsed.data.name,
      status: "failure",
      detail: { error: result.error },
      request,
    });
    return NextResponse.json(
      { success: false, error: result.error, existing: result.existing },
      { status: result.status ?? 500 },
    );
  }

  void recordAudit({
    actor: auth.actor,
    action: "create",
    resource: "transcript-category",
    target: parsed.data.name,
    targetId: result.item.id,
    request,
  });

  return NextResponse.json(
    { success: true, item: result.item },
    { status: 201 },
  );
}
