import { google } from "googleapis";
import { NextResponse } from "next/server";
import { toGoogleImageURL } from "@/utils/driveImage";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = "AutoScrollGallery";

export async function GET() {
  if (!SHEET_ID)
    return NextResponse.json(
      { error: "Missing Google Sheet ID" },
      { status: 500 }
    );

  const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
  const GOOGLE_PRIVATE_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY;

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY_RAW)
    return NextResponse.json(
      { error: "Missing Google credentials" },
      { status: 500 }
    );

  try {
    const privateKey = GOOGLE_PRIVATE_KEY_RAW.includes("\\n")
      ? GOOGLE_PRIVATE_KEY_RAW.replace(/\\n/g, "\n")
      : GOOGLE_PRIVATE_KEY_RAW;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const values = response.data.values || [];
    const imageUrls = values
      .flat()
      .map((url) => url?.trim())
      .filter((url) => url && /^https?:\/\//.test(url))
      .map((url) => toGoogleImageURL(url));

    return NextResponse.json({ images: imageUrls });
  } catch (err: unknown) {
    console.error("AutoScroll Gallery Error:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
