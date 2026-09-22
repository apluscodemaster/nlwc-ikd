import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import {
  getFellowshipCenters,
  createFellowshipCenter,
  updateFellowshipCenter,
  deleteFellowshipCenter,
  seedFellowshipCentersIfEmpty,
} from "@/lib/fellowshipService";
import { requireAuthActor, type AuthActor } from "@/lib/auth";
import { recordAudit } from "@/lib/auditLog";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * House fellowship centers.
 *
 * GET is PUBLIC — /fellowship and the "find a center near me" prompt read it.
 * The write handlers require an admin token, exactly like /api/schedule: the
 * /admin/fellowship UI is gated client-side only, which never protects the API.
 */
async function requireAdmin(
  req: NextRequest,
): Promise<
  { denied: NextResponse; actor?: undefined } | { denied?: undefined; actor: AuthActor }
> {
  const auth = await requireAuthActor(req);
  if (auth.response) return { denied: auth.response };

  const limited = rateLimitMiddleware(req, "authenticated");
  if (limited) return { denied: limited };

  return { actor: auth.actor };
}

const httpUrl = z
  .string()
  .trim()
  .regex(/^https?:\/\/.+/i, "Must be a URL starting with http(s)://");

const centerFields = {
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().trim().min(1, "Address is required"),
  coordinator: z.string().trim().min(1, "Coordinator is required"),
  meetingTime: z.string().trim().min(1, "Meeting time is required"),
  mapLink: httpUrl,
  whatsappLink: httpUrl,
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  areaKeywords: z
    .array(z.string().trim().min(1))
    .transform((list) => list.map((k) => k.toLowerCase())),
  active: z.boolean(),
  order: z.coerce.number().int().min(0),
};

/** Full document for create — optional housekeeping fields get defaults. */
const createSchema = z.object({
  ...centerFields,
  areaKeywords: z
    .array(z.string().trim().min(1))
    .default([])
    .transform((list) => list.map((k) => k.toLowerCase())),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

/**
 * Update accepts any subset. Deliberately built from the default-free fields:
 * Zod 4's `.partial()` still fills `.default()`s, which would turn a toggle
 * like `{ active: false }` into a write that also reset `order` and
 * `areaKeywords`.
 */
const updateSchema = z.object(centerFields).partial();

function validationError(error: z.ZodError) {
  return NextResponse.json(
    {
      error: error.issues[0]?.message || "Invalid input",
      details: error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    },
    { status: 400 },
  );
}

// ── GET: list centers (public) — auto-seeds the static list when empty ──
export async function GET(req: NextRequest) {
  try {
    const includeInactive =
      req.nextUrl.searchParams.get("include") === "inactive";

    // Only the admin may see deactivated centers.
    if (includeInactive) {
      const { denied } = await requireAdmin(req);
      if (denied) return denied;
    }

    let centers = await getFellowshipCenters({ includeInactive });
    if (centers.length === 0) {
      const seeded = await seedFellowshipCentersIfEmpty();
      if (seeded.length > 0) {
        centers = await getFellowshipCenters({ includeInactive });
      }
    }

    return NextResponse.json(
      { centers },
      {
        headers: includeInactive
          ? { "Cache-Control": "no-store" }
          : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      },
    );
  } catch (error) {
    console.error("Failed to fetch fellowship centers:", error);
    return NextResponse.json(
      { error: "Failed to fetch fellowship centers" },
      { status: 500 },
    );
  }
}

// ── POST: create a center ──
export async function POST(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;

  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const result = await createFellowshipCenter(parsed.data);
    revalidatePath("/fellowship");
    void recordAudit({
      actor,
      action: "create",
      resource: "fellowship",
      target: result.name,
      targetId: result.id,
      request: req,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create fellowship center:", error);
    return NextResponse.json(
      { error: "Failed to create fellowship center" },
      { status: 500 },
    );
  }
}

// ── PUT: update a center ──
export async function PUT(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rest: Record<string, unknown> = { ...body };
    delete rest.id;
    const parsed = updateSchema.safeParse(rest);
    if (!parsed.success) return validationError(parsed.error);
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    await updateFellowshipCenter(id, parsed.data);
    revalidatePath("/fellowship");
    void recordAudit({
      actor,
      action: "update",
      resource: "fellowship",
      target: typeof rest?.name === "string" ? rest.name : `center #${id}`,
      targetId: id,
      detail: { fields: Object.keys(parsed.data).join(",") },
      request: req,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update fellowship center:", error);
    return NextResponse.json(
      { error: "Failed to update fellowship center" },
      { status: 500 },
    );
  }
}

// ── DELETE: remove a center ──
export async function DELETE(req: NextRequest) {
  const { denied, actor } = await requireAdmin(req);
  if (denied) return denied;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "id query param is required" },
        { status: 400 },
      );
    }

    await deleteFellowshipCenter(id);
    revalidatePath("/fellowship");
    void recordAudit({
      actor,
      action: "delete",
      resource: "fellowship",
      target: `center #${id}`,
      targetId: id,
      request: req,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete fellowship center:", error);
    return NextResponse.json(
      { error: "Failed to delete fellowship center" },
      { status: 500 },
    );
  }
}
