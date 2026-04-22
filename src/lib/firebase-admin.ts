import * as admin from "firebase-admin";

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;
let initError: Error | null = null;

if (!admin.apps.length) {
  try {
    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n",
    );

    console.log("[Firebase Admin] Initializing with config:");
    console.log("  - projectId:", projectId ? "✓ set" : "✗ MISSING");
    console.log("  - clientEmail:", clientEmail ? "✓ set" : "✗ MISSING");
    console.log("  - privateKey:", privateKey ? "✓ set" : "✗ MISSING");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(`Missing Firebase Admin credentials:
        - projectId: ${projectId ? "✓" : "✗"}
        - clientEmail: ${clientEmail ? "✓" : "✗"}
        - privateKey: ${privateKey ? "✓" : "✗"}
      `);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    adminDb = admin.firestore();
    adminAuth = admin.auth();
    console.log("✓ Firebase Admin initialized successfully");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("✗ Firebase admin initialization failed:", errorMsg);
    initError = error instanceof Error ? error : new Error(String(error));
  }
} else {
  // App already initialized
  adminDb = admin.firestore();
  adminAuth = admin.auth();
}

// Export a wrapper that checks if Firebase is properly initialized
export const getAdminDb = () => {
  if (initError) {
    throw new Error(`Firebase Admin not initialized: ${initError.message}`);
  }
  if (!adminDb) {
    throw new Error("Firebase Admin database not available");
  }
  return adminDb;
};

export const getAdminAuth = () => {
  if (initError) {
    throw new Error(`Firebase Admin not initialized: ${initError.message}`);
  }
  if (!adminAuth) {
    throw new Error("Firebase Admin auth not available");
  }
  return adminAuth;
};

// Legacy exports for backward compatibility
export { adminDb as default };
export type { admin };
