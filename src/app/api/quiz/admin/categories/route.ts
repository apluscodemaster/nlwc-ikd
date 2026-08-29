import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAuthActor } from "@/lib/auth";
import { recordAudit } from "@/lib/auditLog";

/**
 * NOTE: GET is deliberately PUBLIC — the player-facing QuizLauncher reads this
 * to render the category picker, and it only exposes category names. The write
 * handlers (POST/DELETE) require an admin token.
 */

// ── GET: List all categories ──
export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("quiz_categories")
      .select("id, name, created_at")
      .order("name");

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

// ── POST: Create a new category ──
export async function POST(req: NextRequest) {
  const auth = await requireAuthActor(req);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const name = body.name?.trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Category name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (name.length > 60) {
      return NextResponse.json(
        { error: "Category name must be at most 60 characters" },
        { status: 400 },
      );
    }

    const sb = getSupabaseAdmin();

    // Check for duplicates (case-insensitive)
    const { data: existing } = await sb
      .from("quiz_categories")
      .select("id")
      .ilike("name", name)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 },
      );
    }

    const { data, error } = await sb
      .from("quiz_categories")
      .insert({ name })
      .select("id, name, created_at")
      .single();

    if (error) throw error;

    void recordAudit({
      actor: auth.actor,
      action: "create",
      resource: "quiz-category",
      target: name,
      targetId: (data as { id?: string | number })?.id ?? null,
      request: req,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}

// ── DELETE: Remove a category ──
export async function DELETE(req: NextRequest) {
  const auth = await requireAuthActor(req);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 },
      );
    }

    const sb = getSupabaseAdmin();
    const { error } = await sb.from("quiz_categories").delete().eq("id", id);

    if (error) throw error;

    void recordAudit({
      actor: auth.actor,
      action: "delete",
      resource: "quiz-category",
      target: `Category #${id}`,
      targetId: id,
      request: req,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
