/**
 * Manage who is an administrator (the `admin: true` custom claim on a
 * Firebase Auth account). The admin API routes and firestore.rules both
 * require this claim, so a stranger who signs up through the public API key
 * gets nothing.
 *
 *   npx jiti scripts/admin-claims.ts --list                 # every account, admin or not
 *   npx jiti scripts/admin-claims.ts --grant a@x.org b@y.org
 *   npx jiti scripts/admin-claims.ts --revoke a@x.org
 *
 * Reads Firebase Admin credentials from .env.local (or ENV_FILE). A change
 * reaches the person's session the next time their ID token refreshes (within
 * an hour), or straight away if they sign out and back in.
 */
import { readFileSync } from "node:fs";
import * as admin from "firebase-admin";

function loadEnv(file: string) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m && m[1] === "NODE_TLS_REJECT_UNAUTHORIZED") continue;
    if (m && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

async function main() {
  loadEnv(process.env.ENV_FILE || ".env.local");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  const auth = admin.auth();
  const [mode, ...emails] = process.argv.slice(2);

  if (mode === "--list") {
    let pageToken: string | undefined;
    do {
      const page = await auth.listUsers(1000, pageToken);
      for (const u of page.users) {
        const provider = u.providerData[0]?.providerId ?? "anonymous";
        if (provider === "anonymous") continue;
        const isAdmin = u.customClaims?.admin === true;
        console.log(
          `${isAdmin ? "ADMIN" : "     "}  ${u.email ?? "(no email)"}  ${provider}  last sign-in ${u.metadata.lastSignInTime ?? "never"}`,
        );
      }
      pageToken = page.pageToken;
    } while (pageToken);
    return;
  }

  if ((mode !== "--grant" && mode !== "--revoke") || emails.length === 0) {
    console.error("Usage: --list | --grant <email...> | --revoke <email...>");
    process.exit(1);
  }

  for (const email of emails) {
    const user = await auth.getUserByEmail(email);
    const claims = { ...(user.customClaims ?? {}) };
    if (mode === "--grant") claims.admin = true;
    else delete claims.admin;
    await auth.setCustomUserClaims(user.uid, claims);
    console.log(`${mode === "--grant" ? "granted" : "revoked"}: ${email}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
