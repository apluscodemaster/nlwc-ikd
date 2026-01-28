import { NextResponse } from "next/server";
import { recentSermons } from "@/data/sermons";

export async function GET() {
  // Add a slight delay to simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  return NextResponse.json(recentSermons);
}
