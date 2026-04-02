import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/data/events";

export async function GET() {
  return NextResponse.json(getUpcomingEvents());
}
