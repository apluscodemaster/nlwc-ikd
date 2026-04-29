import { NextResponse, NextRequest } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { rateLimitMiddleware } from "@/lib/rateLimit";

export interface VideoMessage {
  date: string;
  youtubeUrl: string;
  title?: string;
  minister?: string;
  serviceCategory?: string;
  id: string; // YouTube ID for thumbnails
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const RANGE = "video_messages!A:E"; // Date, URL, Title, Minister, Service_Category

export async function GET(request: NextRequest) {
  // Apply rate limiting to public endpoint
  const rateLimitError = rateLimitMiddleware(request, "public");
  if (rateLimitError) {
    return rateLimitError;
  }

  if (!SHEET_ID) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const sheets = await getGoogleSheetsClient();

    const sheetsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = sheetsResponse.data.values ?? [];

    // Skip header row if it exists and looks like headers
    const dataRows =
      rows.length > 0 && rows[0][0].toLowerCase().includes("date")
        ? rows.slice(1)
        : rows;

    const messages: VideoMessage[] = dataRows
      .map((row, index) => {
        const [date, url, title, minister, serviceCategory] = row;
        const youtubeId = extractYoutubeId(url);

        return {
          date: date || "",
          youtubeUrl: url || "",
          title: title || `Message - ${date}`,
          minister: minister || "Minister",
          serviceCategory: serviceCategory?.trim() || undefined,
          id: youtubeId || `msg-${index}`,
        };
      })
      .filter((m) => m.youtubeUrl && m.date) // Basic validation
      .reverse(); // Latest first

    // Add cache headers for successful responses
    const response = NextResponse.json({ messages });
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
    return response;
  } catch (err: unknown) {
    console.error("Video Messages API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch video messages" },
      { status: 500 },
    );
  }
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}
