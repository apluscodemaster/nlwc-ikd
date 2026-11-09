import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";
import {
  normalizeColumnsFromSheets,
  groupColumnsToDates,
  RawColumn,
} from "@/lib/sheets";
import { resolveImageUrls } from "@/lib/photoLinkCache";
import { galleryCacheHeaders } from "@/lib/galleryCache";

export type NormalizedColumn = RawColumn & {
  images?: string[];
};

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEETS_NAME || "church_gallery";

// Rendered on demand and cached at the CDN (see galleryCacheHeaders), NOT
// pre-built: pre-building made every deploy resolve all ~900 Google Photos
// share links. Resolutions are remembered in Firestore (lib/photoLinkCache),
// so a request only resolves links it has never seen.
export const dynamic = "force-dynamic";

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

    // ✅ Step 2: Transform all image URLs (Drive & Photos) to direct links,
    // via the shared cache — only never-seen share links hit Google.
    const { urls: resolved, pending } = await resolveImageUrls(
      normalized.flatMap((col) => [
        ...(Array.isArray(col.values) ? col.values : []),
        ...(Array.isArray(col.images) ? col.images : []),
      ]),
    );
    const convert = (list: string[]) =>
      list.map((u) => resolved.get(u?.trim()) ?? u);
    const cleaned = normalized.map((col) => ({
      ...col,
      values: Array.isArray(col.values) ? convert(col.values) : col.values,
      images: Array.isArray(col.images) ? convert(col.images) : col.images,
    }));

    // ✅ Step 2.5: Filter out empty URLs that couldn't be resolved
    const filtered = filterEmptyUrls(cleaned);

    // ✅ Step 3: Group columns by date (no limit)
    const grouped = groupColumnsToDates(filtered);

    // ✅ Step 4: Return JSON response
    return NextResponse.json(
      { dates: grouped },
      { headers: galleryCacheHeaders(pending) },
    );
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
