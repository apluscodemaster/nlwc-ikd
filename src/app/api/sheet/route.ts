import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";
import {
  normalizeColumnsFromSheets,
  groupColumnsToDates,
  RawColumn,
} from "@/lib/sheets";
import { cleanImageColumns } from "@/utils/driveImage";

export type NormalizedColumn = RawColumn & {
  images?: string[];
};

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEETS_NAME || "church_gallery";

/**
 * Filter out empty image URLs that couldn't be resolved
 */
function filterEmptyUrls(columns: NormalizedColumn[]): NormalizedColumn[] {
  return columns.map((col) => ({
    ...col,
    values: Array.isArray(col.values)
      ? col.values.filter((url) => url && url.trim().length > 0)
      : col.values,
    images: Array.isArray(col.images)
      ? col.images.filter((url) => url && url.trim().length > 0)
      : [],
  }));
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

    // Fetch data from the Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
      majorDimension: "COLUMNS",
    });

    const columnsRaw = response.data.values ?? [];

    // ✅ Step 1: Normalize column data
    const normalized = normalizeColumnsFromSheets(
      columnsRaw,
    ) as NormalizedColumn[];

    // ✅ Step 2: Transform all image URLs (Drive & Photos) to proper Googleusercontent links
    // This now includes async resolution of Google Photos share links
    const cleaned = await cleanImageColumns(normalized);

    // ✅ Step 2.5: Filter out empty URLs that couldn't be resolved
    const filtered = filterEmptyUrls(cleaned);

    // ✅ Step 3: Group columns by date (no limit)
    const grouped = groupColumnsToDates(filtered);

    // ✅ Step 4: Return JSON response
    return NextResponse.json({ dates: grouped });
  } catch (err: unknown) {
    console.error("Sheets API Error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : JSON.stringify(err);

    return NextResponse.json(
      { error: "Sheets API error", details: message },
      { status: 500 },
    );
  }
}
