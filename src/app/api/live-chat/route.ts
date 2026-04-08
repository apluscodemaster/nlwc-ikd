import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// In-memory Chat Store (persists across requests within the same server process)
//
// NOTE: On Vercel serverless, messages persist while the lambda is warm (minutes
// to hours of activity). For true persistence across cold starts/deployments,
// upgrade to a database (e.g. Vercel KV, Supabase, or MongoDB Atlas).
// For a live service chat used within service hours, this is practical.
// =============================================================================

interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: number; // Unix ms
  color: string;
}

const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Module-level storage — survives across API calls in the same process
const messages: ChatMessage[] = [];

// Predefined avatar colors for variety
const COLORS = [
  "#E53935",
  "#D81B60",
  "#8E24AA",
  "#5E35B1",
  "#3949AB",
  "#1E88E5",
  "#039BE5",
  "#00ACC1",
  "#00897B",
  "#43A047",
  "#7CB342",
  "#C0CA33",
  "#FDD835",
  "#FFB300",
  "#FB8C00",
  "#F4511E",
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function pruneExpiredMessages() {
  const cutoff = Date.now() - MESSAGE_TTL_MS;
  // ⚡ Find first non-expired message and remove everything before it in one operation (O(n))
  // instead of repeated shift() calls which are each O(n)
  const firstValid = messages.findIndex((m) => m.timestamp >= cutoff);
  if (firstValid > 0) {
    messages.splice(0, firstValid);
  } else if (firstValid === -1 && messages.length > 0) {
    messages.length = 0; // All expired
  }
}

// =============================================================================
// GET — Fetch messages (optionally since a given timestamp)
// =============================================================================
export async function GET(request: NextRequest) {
  pruneExpiredMessages();

  const since = request.nextUrl.searchParams.get("since");
  const sinceMs = since ? parseInt(since, 10) : 0;

  const filtered = sinceMs
    ? messages.filter((m) => m.timestamp > sinceMs)
    : messages;

  return NextResponse.json({
    messages: filtered,
    serverTime: Date.now(),
  });
}

// =============================================================================
// POST — Send a new message
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, message } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    if (message.trim().length > 500) {
      return NextResponse.json(
        { error: "Message too long (max 500 characters)" },
        { status: 400 },
      );
    }

    pruneExpiredMessages();

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      message: message.trim(),
      timestamp: Date.now(),
      color: getColorForName(name.trim()),
    };

    messages.push(newMessage);

    // Cap at 200 messages to prevent unbounded growth
    if (messages.length > 200) {
      messages.splice(0, messages.length - 200);
    }

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
