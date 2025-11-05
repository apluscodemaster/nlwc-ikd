import { google } from "googleapis";
import { NextResponse } from "next/server";
import { normalizeColumnsFromSheets, groupColumnsToDates } from "@/lib/sheets";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = process.env.GOOGLE_SHEETS_NAME || "church_gallery";

export async function GET() {
  if (!SHEET_ID) {
    return NextResponse.json(
      { error: "Missing GOOGLE_SHEETS_ID" },
      { status: 500 }
    );
  }

  // Validate required GOOGLE_* env variables early with clearer errors
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
    // Authenticate using Service Account
    // Make private key handling robust: support both literal newlines and escaped "\\n" sequences
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

    // Fetch the values from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_NAME,
      majorDimension: "COLUMNS",
    });

    const columnsRaw = response.data.values ?? [];
    const normalized = normalizeColumnsFromSheets(columnsRaw);
    const grouped = groupColumnsToDates(normalized, 12);

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
