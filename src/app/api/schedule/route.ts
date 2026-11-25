import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { expireSchedule, getPublicSchedule } from "@/lib/publicSchedule.server";
import {
  createRecurringService,
  updateRecurringService,
  deleteRecurringService,
  createSpecialService,
  updateSpecialService,
  deleteSpecialService,
  updateScheduleSettings,
  createAnnualMeeting,
  updateAnnualMeeting,
  deleteAnnualMeeting,
} from "@/lib/scheduleService";
import { requireAuthActor, type AuthActor } from "@/lib/auth";
import { recordAudit } from "@/lib/auditLog";
import { rateLimitMiddleware } from "@/lib/rateLimit";


/**
 * GET is PUBLIC — the live/schedule pages read it to show service times.
 *
 * The write handlers (POST/PUT/DELETE) require an admin token. They previously
 * had none: the /admin/schedule UI is gated client-side only, so anyone could
 * create, edit or delete the church's service schedule by calling this route
 * directly.
 */
/**
 * Auth + rate limit for the write handlers.
 *
 * Returns `{ denied }` to short-circuit, or `{ actor }` — the verified identity,
 * which the handlers attribute their audit entries to.
 */
async function requireAdmin(
  req: NextRequest,
): Promise<
  | { denied: NextResponse; actor?: undefined }
  | { denied?: undefined; actor: AuthActor }
> {
  const auth = await requireAuthActor(req);
  if (auth.response) return { denied: auth.response };

  const limited = await rateLimitMiddleware(req, "authenticated");
  if (limited) return { denied: limited };

  return { actor: auth.actor };
}

/** Annual meeting fields from a request body, validated. */
function annualFields(data: Record<string, unknown>) {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const period = typeof data.period === "string" ? data.period.trim() : "";
  const imageUrl =
    typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    return { error: "Image must be a full http(s) URL" } as const;
  }
  return {
    fields: {
      name,
      period,
      description:
        typeof data.description === "string" ? data.description.trim() : "",
      imageUrl,
      active: data.active !== false,
      order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
    },
  } as const;
}

// ── GET: Fetch all schedules (public) ──
// Served from the shared cache (lib/publicSchedule.server.ts); every write
// below expires it, so admins see their change on the next read.
export async function GET(req: NextRequest) {
  const limited = await rateLimitMiddleware(req, "public");
  if (limited) return limited;

  try {
    return NextResponse.json(await getPublicSchedule(), {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 },
    );
  }
}

// ── POST: Create a schedule entry ──
export async function POST(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { type, ...data } = body;

    if (type === "annual") {
      const parsed = annualFields(data);
      if ("error" in parsed) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      if (!parsed.fields.name || !parsed.fields.period) {
        return NextResponse.json(
          { error: "Missing required fields: name, period" },
          { status: 400 },
        );
      }
      const result = await createAnnualMeeting(parsed.fields);
      expireSchedule();
      revalidatePath("/");
      void recordAudit({
        actor,
        action: "create",
        resource: "schedule",
        target: parsed.fields.name,
        targetId: result.id ?? null,
        detail: { type: "annual" },
        request: req,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (
      !type ||
      !data.label ||
      data.startHour === undefined ||
      data.endHour === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields: type, label, startHour, endHour" },
        { status: 400 },
      );
    }

    if (
      data.startHour < 0 ||
      data.startHour > 23 ||
      data.endHour < 0 ||
      data.endHour > 24
    ) {
      return NextResponse.json(
        { error: "Hours must be between 0-23 (start) and 0-24 (end)" },
        { status: 400 },
      );
    }

    if (!data.endsNextDay && data.startHour >= data.endHour) {
      return NextResponse.json(
        {
          error:
            "Start hour must be before end hour (or enable 'Ends next day')",
        },
        { status: 400 },
      );
    }

    if (type === "recurring") {
      if (
        data.dayOfWeek === undefined ||
        data.dayOfWeek < 0 ||
        data.dayOfWeek > 6
      ) {
        return NextResponse.json(
          { error: "dayOfWeek is required and must be 0-6" },
          { status: 400 },
        );
      }
      const result = await createRecurringService({
        dayOfWeek: data.dayOfWeek,
        startHour: data.startHour,
        endHour: data.endHour,
        endsNextDay: data.endsNextDay || false,
        label: data.label,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        location: data.location || "",
        category: data.category || "",
        icon: data.icon || "",
        recurrenceLabel: data.recurrenceLabel || "",
        active: data.active !== false,
      });
      expireSchedule();
      void recordAudit({
        actor,
        action: "create",
        resource: "schedule",
        target: data.label,
        targetId: (result as { id?: string })?.id ?? null,
        detail: { type: "recurring", dayOfWeek: data.dayOfWeek },
        request: req,
      });
      return NextResponse.json(result, { status: 201 });
    }

    if (type === "special") {
      if (!data.date) {
        return NextResponse.json(
          { error: "date is required for special events (YYYY-MM-DD)" },
          { status: 400 },
        );
      }
      const result = await createSpecialService({
        date: data.date,
        startHour: data.startHour,
        endHour: data.endHour,
        endsNextDay: data.endsNextDay || false,
        label: data.label,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        location: data.location || "",
        category: data.category || "",
        icon: data.icon || "",
        recurrenceLabel: data.recurrenceLabel || "",
        active: data.active !== false,
      });
      expireSchedule();
      void recordAudit({
        actor,
        action: "create",
        resource: "schedule",
        target: data.label,
        targetId: (result as { id?: string })?.id ?? null,
        detail: { type: "special", date: data.date },
        request: req,
      });
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json(
      { error: 'type must be "recurring" or "special"' },
      { status: 400 },
    );
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule entry" },
      { status: 500 },
    );
  }
}

// ── PUT: Update an existing schedule entry ──
export async function PUT(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { type, id, ...data } = body;

    // Schedule-wide settings (no id): currently the monthly auto-add switch.
    if (type === "settings") {
      if (typeof data.autoAddSpecials !== "boolean") {
        return NextResponse.json(
          { error: "autoAddSpecials (boolean) is required" },
          { status: 400 },
        );
      }
      await updateScheduleSettings({ autoAddSpecials: data.autoAddSpecials });
      expireSchedule();
      void recordAudit({
        actor,
        action: "update",
        resource: "schedule",
        target: "Auto-add monthly special services",
        detail: { type: "settings", autoAddSpecials: data.autoAddSpecials },
        request: req,
      });
      return NextResponse.json({ success: true });
    }

    if (!type || !id) {
      return NextResponse.json(
        { error: "type and id are required" },
        { status: 400 },
      );
    }

    if (data.startHour !== undefined && data.endHour !== undefined) {
      if (!data.endsNextDay && data.startHour >= data.endHour) {
        return NextResponse.json(
          {
            error:
              "Start hour must be before end hour (or enable 'Ends next day')",
          },
          { status: 400 },
        );
      }
    }

    if (type === "recurring") {
      await updateRecurringService(id, data);
    } else if (type === "special") {
      await updateSpecialService(id, data);
    } else if (type === "annual") {
      // Partial updates (e.g. just { active }) keep the other fields.
      const parsed = annualFields({ active: true, ...data });
      if ("error" in parsed) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      const update = Object.fromEntries(
        Object.entries(parsed.fields).filter(([k]) => k in data),
      );
      if ("name" in update && !update.name) {
        return NextResponse.json(
          { error: "name is required" },
          { status: 400 },
        );
      }
      await updateAnnualMeeting(id, update);
      revalidatePath("/");
    } else {
      return NextResponse.json(
        { error: 'type must be "recurring", "special" or "annual"' },
        { status: 400 },
      );
    }

    expireSchedule();
    void recordAudit({
      actor,
      action: "update",
      resource: "schedule",
      target:
        typeof data?.label === "string"
          ? data.label
          : typeof data?.name === "string"
            ? data.name
            : `${type} #${id}`,
      targetId: id,
      detail: { type },
      request: req,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule entry" },
      { status: 500 },
    );
  }
}

// ── DELETE: Remove a schedule entry ──
export async function DELETE(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "type and id query params are required" },
        { status: 400 },
      );
    }

    if (type === "recurring") {
      await deleteRecurringService(id);
    } else if (type === "special") {
      await deleteSpecialService(id);
    } else if (type === "annual") {
      await deleteAnnualMeeting(id);
      revalidatePath("/");
    } else {
      return NextResponse.json(
        { error: 'type must be "recurring", "special" or "annual"' },
        { status: 400 },
      );
    }

    expireSchedule();
    void recordAudit({
      actor,
      action: "delete",
      resource: "schedule",
      target: `${type} #${id}`,
      targetId: id,
      detail: { type },
      request: req,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule entry" },
      { status: 500 },
    );
  }
}
