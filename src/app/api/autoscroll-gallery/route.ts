import { NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { resolveImageUrls } from "@/lib/photoLinkCache";
import { galleryCacheHeaders } from "@/lib/galleryCache";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = "AutoScrollGallery";

// Rendered on demand and cached at the CDN (see galleryCacheHeaders), not
// pre-built at deploy time. Google Photos share links resolve through the
// shared Firestore cache (lib/photoLinkCache), so only new links hit Google.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!SHEET_ID)
    return NextResponse.json(
      { error: "Missing Google Sheet ID" },
      { status: 500 },
    );

  try {
    // ⚡ Reuse shared Google Sheets client instead of duplicating auth init
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const sheetUrls = (response.data.values || [])
      .flat()
      .map((url) => (typeof url === "string" ? url.trim() : ""))
      .filter((url) => url && /^https?:\/\//.test(url));

    const { urls: resolved, pending } = await resolveImageUrls(sheetUrls);

    // Keep sheet order; drop links that couldn't be resolved (yet).
    const validUrls = sheetUrls
      .map((url) => resolved.get(url) ?? "")
      .filter((url) => url.length > 0);

    return NextResponse.json(
      { images: validUrls },
      { headers: galleryCacheHeaders(pending) },
    );
  } catch (err: unknown) {
    console.error("AutoScroll Gallery Error:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
