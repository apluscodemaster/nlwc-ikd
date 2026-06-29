import { cache } from "react";
import { getGoogleSheetsClient } from "@/lib/googleSheets";

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

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Fetch and normalise all video messages from the Google Sheet.
 *
 * Wrapped in React `cache` so a single server request (e.g. generateMetadata +
 * the page render of /video-messages/<slug>) reads the sheet only once.
 */
export const getVideoMessages = cache(async (): Promise<VideoMessage[]> => {
  if (!SHEET_ID) {
    throw new Error("GOOGLE_SHEETS_ID is not configured");
  }

  const sheets = await getGoogleSheetsClient();
  const sheetsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = sheetsResponse.data.values ?? [];

  // Skip the header row when present.
  const dataRows =
    rows.length > 0 && rows[0][0].toLowerCase().includes("date")
      ? rows.slice(1)
      : rows;

  return dataRows
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
});
