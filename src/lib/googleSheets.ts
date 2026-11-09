// The standalone Sheets client — NOT the umbrella "googleapis" package, whose
// type definitions cover every Google API (~150 MB loaded by TypeScript) and
// pushed the type check past the build machine's memory limit.
import { auth as googleAuth, sheets, type sheets_v4 } from "@googleapis/sheets";

/**
 * One client per server instance. GoogleAuth caches its OAuth access token
 * and refreshes it only when it expires; building a new client per call (as
 * before) re-signed a JWT and fetched a fresh token on every request — an
 * extra Google round-trip each time, on top of the Sheets read itself.
 */
let cachedClient: sheets_v4.Sheets | null = null;

export async function getGoogleSheetsClient() {
  if (cachedClient) return cachedClient;

  const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
  const GOOGLE_PRIVATE_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY;

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY_RAW) {
    throw new Error("Missing Google Sheets credentials");
  }

  // Handle escaped newlines in private key
  const privateKey = GOOGLE_PRIVATE_KEY_RAW.includes("\\n")
    ? GOOGLE_PRIVATE_KEY_RAW.replace(/\\n/g, "\n")
    : GOOGLE_PRIVATE_KEY_RAW;

  const auth = new googleAuth.GoogleAuth({
    credentials: {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: privateKey,
      client_email: GOOGLE_CLIENT_EMAIL,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  cachedClient = sheets({ version: "v4", auth });
  return cachedClient;
}
