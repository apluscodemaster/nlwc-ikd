import { NextRequest, NextResponse } from "next/server";
import { getManualBySlug } from "@/lib/wordpress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const manual = await getManualBySlug(slug);

    if (!manual) {
      return NextResponse.json({ error: "Manual not found" }, { status: 404 });
    }

    return NextResponse.json({ data: manual });
  } catch (error) {
    console.error("Failed to fetch manual:", error);
    return NextResponse.json(
      { error: "Failed to fetch manual" },
      { status: 500 },
    );
  }
}
