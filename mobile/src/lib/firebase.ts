/**
 * Firebase client for the few features that use Firestore directly, exactly
 * as the website does (live chat, testimonies feed, devotionals archive).
 * Access is governed by the same firestore.rules.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./config";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

export function getDb(): Firestore {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase isn't configured for this build (EXPO_PUBLIC_FIREBASE_*).");
  }
  if (db) return db;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    // Long polling is more reliable than WebChannel streaming on React Native.
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    db = getFirestore(app); // already initialised (fast refresh)
  }
  return db;
}
