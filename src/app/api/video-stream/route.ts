import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const RANGE = "video_stream!A:A"; // Only the URL column

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
        { error: "No stream URL found", url: null },
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
    });
  } catch (err: unknown) {
    console.error("Video Stream API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch video stream URL" },
      { status: 500 },
    );
  }
}
