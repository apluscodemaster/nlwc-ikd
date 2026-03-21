import { google } from "googleapis";

export async function getGoogleSheetsClient() {
  const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
  const GOOGLE_PRIVATE_KEY_RAW = process.env.GOOGLE_PRIVATE_KEY;

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY_RAW) {
    throw new Error("Missing Google Sheets credentials");
  }

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

  return google.sheets({ version: "v4", auth });
}
