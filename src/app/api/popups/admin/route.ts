import { NextRequest, NextResponse } from "next/server";
import { requireAuthActor, type AuthActor } from "@/lib/auth";
import { recordAudit } from "@/lib/auditLog";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import {
  createPopup,
  deletePopup,
  listPopups,
  popupInputSchema,
  updatePopup,
} from "@/lib/popupStore.server";
import { BUILT_IN_IDS } from "@/lib/sitePopups";

export const dynamic = "force-dynamic";

/**
 * Admin management of site pop-ups (Admin → Settings → Pop-ups).
 * GET lists all (including switched-off ones); POST creates an announcement;
 * PUT updates any pop-up; DELETE removes an announcement (built-ins can only
 * be switched off).
 */
async function requireAdmin(
  req: NextRequest,
): Promise<{ denied: NextResponse; actor?: undefined } | { denied?: undefined; actor: AuthActor }> {
  const auth = await requireAuthActor(req);
  if (auth.response) return { denied: auth.response };
  const limited = await rateLimitMiddleware(req, "authenticated");
  if (limited) return { denied: limited };
  return { actor: auth.actor };
}

function invalid(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const first = error.issues[0];
  return NextResponse.json(
    {
      error: first ? first.message : "Invalid pop-up",
      field: first?.path.join("."),
    },
    { status: 400 },
  );
}

export async function GET(req: NextRequest) {
  const { denied } = await requireAdmin(req);
  if (denied) return denied;
  try {
    return NextResponse.json(
      { popups: await listPopups() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[popups/admin] list failed:", err);
    return NextResponse.json({ error: "Failed to load pop-ups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;
  const parsed = popupInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);
  try {
    const popup = await createPopup({ ...parsed.data, kind: "announcement" });
    void recordAudit({
      actor,
      action: "create",
      resource: "popup",
      target: popup.name,
      targetId: popup.id,
      request: req,
    });
    return NextResponse.json(popup, { status: 201 });
  } catch (err) {
    console.error("[popups/admin] create failed:", err);
    return NextResponse.json({ error: "Failed to create the pop-up" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const parsed = popupInputSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  try {
    await updatePopup(id, parsed.data);
    void recordAudit({
      actor,
      action: "update",
      resource: "popup",
      target: parsed.data.name,
      targetId: id,
      detail: { active: parsed.data.active },
      request: req,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "not-found") {
      return NextResponse.json({ error: "Pop-up not found" }, { status: 404 });
    }
    console.error("[popups/admin] update failed:", err);
    return NextResponse.json({ error: "Failed to save the pop-up" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (BUILT_IN_IDS.has(id)) {
    return NextResponse.json(
      { error: "Built-in pop-ups can't be deleted; switch it off instead." },
      { status: 400 },
    );
  }
  try {
    await deletePopup(id);
    void recordAudit({
      actor,
      action: "delete",
      resource: "popup",
      target: id,
      targetId: id,
      request: req,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[popups/admin] delete failed:", err);
    return NextResponse.json({ error: "Failed to delete the pop-up" }, { status: 500 });
  }
}
