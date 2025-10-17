import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
import { normalizeColumnsFromSheets, groupColumnsToDates } from "@/lib/sheets";

const SHEET_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEETS_ID;
const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY ||
  process.env.GOOGLE_SHEETS_API_KEY;
const SHEET_NAME = process.env.GOOGLE_SHEETS_NAME || "Sheet1";

if (!SHEET_ID || !API_KEY) {
  // This check runs at build/run time on the server
  // We'll still allow route to run but will return error if missing
}

export async function GET() {
  if (!SHEET_ID || !API_KEY) {
    return NextResponse.json(
      { error: "Missing GOOGLE_SHEETS_ID or API_KEY" },
      { status: 500 }
    );
  }

  try {
    // Use batchGet with majorDimension=COLUMNS and range as sheet name to get all used columns
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchGet?majorDimension=COLUMNS&key=${API_KEY}&ranges=${encodeURIComponent(
      SHEET_NAME
    )}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Sheets API error", details: text },
        { status: res.status }
      );
    }
    const data = await res.json();

    // data.valueRanges[0].values is an array of column arrays
    const columnsRaw = data?.valueRanges?.[0]?.values ?? [];

    // Normalize and group
    const normalized = normalizeColumnsFromSheets(columnsRaw);
    const grouped = groupColumnsToDates(normalized, 12);

    // Return grouped dates (chronological ascending)
    return NextResponse.json({ dates: grouped });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : JSON.stringify(err);
    return NextResponse.json(
      { error: "Unexpected server error", details: message },
      { status: 500 }
    );
  }
}
