import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";
import {
  toGoogleImageURL,
  resolveGooglePhotosShareLink,
  detectGoogleImageSource,
} from "@/utils/driveImage";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = "AutoScrollGallery";

export async function GET() {
  if (!SHEET_ID)
    return NextResponse.json(
      { error: "Missing Google Sheet ID" },
      { status: 500 }
    );

  try {
    // ⚡ Reuse shared Google Sheets client instead of duplicating auth init
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const values = response.data.values || [];
    const imageUrls = await Promise.all(
      values
        .flat()
        .map((url) => url?.trim())
        .filter((url) => url && /^https?:\/\//.test(url))
        .map(async (url) => {
          const source = detectGoogleImageSource(url);
          if (source === "googlephotos") {
            return resolveGooglePhotosShareLink(url);
          }
          return toGoogleImageURL(url);
        })
    );

    // Filter out empty strings from failed resolutions
    const validUrls = imageUrls.filter((url) => url && url.length > 0);

    return NextResponse.json({ images: validUrls });
  } catch (err: unknown) {
    console.error("AutoScroll Gallery Error:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
