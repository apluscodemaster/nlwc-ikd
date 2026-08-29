/**
 * Admin audit log API.
 *
 *   GET  — read a page of entries (admin only).
 *   POST — record an action performed by a client-side write.
 *
 * Why POST exists: devotionals and testimonies are written straight from the
 * browser to Firestore (see `devotionals.ts` / `testimonyService.ts`) rather
 * than through an API route, so a server-side hook has nothing to intercept.
 * Those pages report their action here instead.
 *
 * The trust boundary is deliberate and worth stating plainly: the actor is
 * taken from the verified ID token, so WHO acted cannot be forged. The action
 * description comes from the client, so a determined admin could mislabel their
 * own entry. Actions that flow through server routes (content publishing,
 * schedule, quiz, media) are recorded server-side and carry no such caveat.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuthActor } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import {
  recordAudit,
  listAudit,
  listAuditActors,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type AuditAction,
  type AuditResource,
} from "@/lib/auditLog";

export const dynamic = "force-dynamic";

const ACTIONS: readonly AuditAction[] = [
  "create",
  "update",
  "delete",
  "publish",
  "upload",
  "reset",
  "login",
  "logout",
];

const RESOURCES: readonly AuditResource[] = [
  "content",
  "devotional",
  "testimony",
  "quiz-question",
  "quiz-category",
  "quiz-stats",
  "schedule",
  "media",
  "session",
];

export async function GET(request: NextRequest) {
  const auth = await requireAuthActor(request);
  if (auth.response) return auth.response;

  // Each page is a Firestore read that can scan up to 500 docs when filters are
  // applied, so this endpoint is worth bounding like the other authed routes.
  const limited = rateLimitMiddleware(request, "authenticated");
  if (limited) return limited;

  try {
    const params = request.nextUrl.searchParams;

    const rawLimit = Number(params.get("limit"));
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(1, rawLimit), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

    const rawBefore = Number(params.get("before"));
    const before = Number.isFinite(rawBefore) && rawBefore > 0 ? rawBefore : undefined;

    const [result, actors] = await Promise.all([
      listAudit({
        limit,
        before,
        actorEmail: params.get("actor") || undefined,
        action: params.get("action") || undefined,
        resource: params.get("resource") || undefined,
      }),
      // Only needed to populate the filter dropdown on the first page.
      before ? Promise.resolve<string[]>([]) : listAuditActors(),
    ]);

    return NextResponse.json({
      entries: result.entries,
      nextBefore: result.nextBefore,
      actors,
    });
  } catch (err) {
    console.error("[audit] list failed:", err);
    return NextResponse.json(
      { error: "Failed to load audit log" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthActor(request);
  if (auth.response) return auth.response;

  const limited = rateLimitMiddleware(request, "authenticated");
  if (limited) return limited;

  try {
    const body = await request.json();

    const action = body?.action;
    const resource = body?.resource;

    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    if (!RESOURCES.includes(resource)) {
      return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }

    await recordAudit({
      // Verified identity — never body.actor.
      actor: auth.actor,
      action,
      resource,
      target: typeof body?.target === "string" ? body.target : null,
      targetId:
        typeof body?.targetId === "string" || typeof body?.targetId === "number"
          ? body.targetId
          : null,
      status: body?.status === "failure" ? "failure" : "success",
      detail:
        body?.detail && typeof body.detail === "object" ? body.detail : null,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[audit] record failed:", err);
    return NextResponse.json(
      { error: "Failed to record audit entry" },
      { status: 500 },
    );
  }
}
