import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { getSpeakersList, getSeriesList } from "@/lib/audioSermons";
import { requireAuthActor } from "@/lib/auth";
import { recordAudit } from "@/lib/auditLog";
import { wpTaxonomyCreateSchema } from "@/types/wp-types";
import {
  createSpeakerInSeriesEngine,
  createSeriesInSeriesEngine,
} from "@/services/wp-service";

/**
 * GET /api/wp/speakers?type=speakers|series[&fresh=1]
 *
 * Fetches the list of speakers/ministers or sermon series from WordPress
 * for use in the admin dropdowns. `fresh=1` skips every cache layer — the
 * admin uses it after creating a new entry so the dropdown picks it up.
 */
export async function GET(request: NextRequest) {
  // Rate limited: proxies WordPress.
  const limited = rateLimitMiddleware(request, "public");
  if (limited) return limited;

  const type = request.nextUrl.searchParams.get("type") || "speakers";
  const fresh = request.nextUrl.searchParams.get("fresh") === "1";
  const headers = fresh
    ? { "Cache-Control": "no-store" }
    : { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" };

  try {
    if (type === "series") {
      const series = await getSeriesList(fresh);
      return NextResponse.json({ series }, { headers });
    }

    // Default: speakers
    const speakers = await getSpeakersList(fresh);
    return NextResponse.json({ speakers }, { headers });
  } catch (error) {
    console.error(`Failed to fetch ${type}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${type}`, [type]: [] },
      { status: 500 },
    );
  }
}

/**
 * POST /api/wp/speakers
 *
 * Body: `{ type: "speaker", name }` or `{ type: "series", title, description? }`.
 * Creates the row in the Series Engine tables (so it shows in wp-admin) and
 * returns it in the same shape as the GET lists. A duplicate returns 409 with
 * the existing row under `existing`, so the admin can just select that one.
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

  const parsed = wpTaxonomyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message || "Validation failed",
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const result =
    payload.type === "speaker"
      ? await createSpeakerInSeriesEngine(payload)
      : await createSeriesInSeriesEngine(payload);

  const label = payload.type === "speaker" ? payload.name : payload.title;

  if (!result.success) {
    void recordAudit({
      actor: auth.actor,
      action: "create",
      resource: payload.type,
      target: label,
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
    resource: payload.type,
    target: label,
    targetId: result.item.id,
    request,
  });

  return NextResponse.json(
    { success: true, item: result.item },
    { status: 201 },
  );
}
