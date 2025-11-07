import { google } from "googleapis";
import { NextResponse } from "next/server";
import {
  normalizeColumnsFromSheets,
  groupColumnsToDates,
  RawColumn,
} from "@/lib/sheets";
import { toGoogleImageURL, cleanImageColumns } from "@/utils/driveImage";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEETS_NAME || "church_gallery";

//  type NormalizedColumn = {
//    date?: string;
//    images?: string[];
//    [key: string]: unknown;
//  };

type NormalizedColumn = RawColumn & {
  images?: string[];
};

export async function GET() {
  if (!SHEET_ID) {
    return NextResponse.json(
      { error: "Missing GOOGLE_SHEETS_ID" },
      { status: 500 }
    );
  }

  const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
  const GOOGLE_PRIVATE_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY;

  if (!GOOGLE_CLIENT_EMAIL) {
    return NextResponse.json(
      { error: "Missing GOOGLE_CLIENT_EMAIL" },
      { status: 500 }
    );
  }

  if (!GOOGLE_PRIVATE_KEY_RAW) {
    return NextResponse.json(
      { error: "Missing GOOGLE_PRIVATE_KEY" },
      { status: 500 }
    );
  }

  try {
    // Handle escaped newlines in private key
    const privateKey = GOOGLE_PRIVATE_KEY_RAW.includes("\\n")
      ? GOOGLE_PRIVATE_KEY_RAW.replace(/\\n/g, "\n")
      : GOOGLE_PRIVATE_KEY_RAW;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: process.env.GOOGLE_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: privateKey,
        client_email: GOOGLE_CLIENT_EMAIL,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Fetch data from the Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
      majorDimension: "COLUMNS",
    });

    const columnsRaw = response.data.values ?? [];

    // ✅ Step 1: Normalize column data
    const normalized = normalizeColumnsFromSheets(columnsRaw);

    // ✅ Step 2: Transform all image URLs to proper Googleusercontent links
    const cleaned: RawColumn[] = cleanImageColumns(normalized);

    // ✅ Step 3: Group columns by date (12 per page)
    const grouped = groupColumnsToDates(cleaned, 12);

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
      { status: 500 }
    );
  }
}
