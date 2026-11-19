import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";
import type { StreamState } from "@/lib/liveSchedule";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const RANGE = "video_stream!A:A"; // Only the URL column

// Cache the handler's result for a minute (ISR for route handlers). Every
// /live visitor requests this, peaking during services, and each uncached
// call read Google Sheets (per-minute read quota). The stream URL changes at
// most once per service, and an admin update still shows within 60s.
export const revalidate = 60;

/**
 * The stream's live state from the YouTube Data API (videos.list, 1 quota
 * unit; with the 60 s cache above that's at most ~1,440 units a day of the
 * free 10,000). Needs YOUTUBE_API_KEY; without it, or for a channel link
 * (finding a channel's live video costs 100 units), the state is "unknown"
 * and the site falls back to the schedule plus a grace period.
 */
async function youtubeStreamState(
  videoId: string | null,
): Promise<StreamState> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !videoId) return "unknown";
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,liveStreamingDetails");
    url.searchParams.set("id", videoId);
    url.searchParams.set("key", key);
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return "unknown";
    const data = (await res.json()) as {
      items?: {
        snippet?: { liveBroadcastContent?: string };
        liveStreamingDetails?: { actualEndTime?: string };
      }[];
    };
    const item = data.items?.[0];
    if (!item) return "unknown";
    const content = item.snippet?.liveBroadcastContent;
    if (content === "live") return "live";
    if (content === "upcoming") return "upcoming";
    // "none": a finished broadcast has liveStreamingDetails; an ordinary
    // upload doesn't, and says nothing about a service.
    return item.liveStreamingDetails ? "ended" : "unknown";
  } catch {
    return "unknown";
  }
}

export async function GET() {
  if (!SHEET_ID) {
    return NextResponse.json(
      { error: "Missing GOOGLE_SHEETS_ID" },
      { status: 500 },
    );
  }

  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values ?? [];

    // Skip header row if it looks like a header
    const dataRows =
      rows.length > 0 && rows[0][0] && rows[0][0].toLowerCase().includes("url")
        ? rows.slice(1)
        : rows;

    // Get the first non-empty URL
    const streamUrl = dataRows
      .map((row) => (row[0] || "").trim())
      .find((url) => url.length > 0);

    if (!streamUrl) {
      return NextResponse.json(
        { error: "No stream URL found", url: null, status: "unknown" },
        { status: 404 },
      );
    }

    // Extract YouTube channel ID or video ID from the URL
    let channelId: string | null = null;
    let videoId: string | null = null;

    // Match channel URL patterns:
    // youtube.com/channel/UC...
    // youtube.com/live_stream?channel=UC...
    const channelMatch = streamUrl.match(/(?:channel\/|channel=)(UC[\w-]+)/);
    if (channelMatch) {
      channelId = channelMatch[1];
    }

    // Match video/live URL patterns:
    // youtube.com/watch?v=...
    // youtu.be/...
    // youtube.com/live/...
    if (!channelId) {
      const videoMatch = streamUrl.match(
        /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*)/,
      );
      if (videoMatch && videoMatch[1].length === 11) {
        videoId = videoMatch[1];
      }
    }

    // Build the embed URL
    let embedUrl: string;
    if (channelId) {
      embedUrl = `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
    } else if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else {
      // Fallback: use the raw URL (could be a direct embed URL)
      embedUrl = streamUrl;
    }

    return NextResponse.json({
      url: streamUrl,
      embedUrl,
      channelId,
      videoId,
      status: await youtubeStreamState(videoId),
    });
  } catch (err: unknown) {
    console.error("Video Stream API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch video stream URL" },
      { status: 500 },
    );
  }
}
