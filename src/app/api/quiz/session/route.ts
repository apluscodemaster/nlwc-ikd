import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { z } from "zod";

const sessionSchema = z.object({
  session_id: z.string().uuid(),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must be under 30 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = sessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid data" },
        { status: 400 },
      );
    }

    const { session_id, username } = result.data;

    // Upsert — create if new, update last_active if exists
    const { data, error } = await getSupabase()
      .from("sessions")
      .upsert(
        { session_id, username, last_active: new Date().toISOString() },
        { onConflict: "session_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("Session upsert error:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to process session request" },
      { status: 500 },
    );
  }
}
