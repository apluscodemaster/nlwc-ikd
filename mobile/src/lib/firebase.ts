/**
 * Firebase client for the few features that use Firestore directly, exactly
 * as the website does (live chat, testimonies feed, devotionals archive).
 * Access is governed by the same firestore.rules.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getAuth, initializeAuth, signInAnonymously, type Auth, type Persistence } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./config";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

function firebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase isn't configured for this build (EXPO_PUBLIC_FIREBASE_*).");
  }
  app ??= getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getDb(): Firestore {
  if (db) return db;
  const app = firebaseApp();
  try {
    // Long polling is more reliable than WebChannel streaming on React Native.
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    db = getFirestore(app); // already initialised (fast refresh)
  }
  return db;
}

/**
 * Firebase Auth, kept across launches (AsyncStorage). Only used for the
 * live chat's anonymous sign-in, which the Firestore rules use to limit each
 * poster to one message every 3 seconds.
 */
function getChatAuth(): Auth {
  if (auth) return auth;
  // React Native build export (missing from the web typings firebase ships).
  const rnPersistence = (
    FirebaseAuth as unknown as {
      getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
    }
  ).getReactNativePersistence;
  try {
    auth = initializeAuth(firebaseApp(), rnPersistence ? { persistence: rnPersistence(AsyncStorage) } : {});
  } catch {
    auth = getAuth(firebaseApp()); // already initialised (fast refresh)
  }
  return auth;
}

/** This phone's chat identity: an anonymous sign-in, created on first use. */
export async function getChatUid(): Promise<string> {
  const a = getChatAuth();
  if (a.currentUser) return a.currentUser.uid;
  return (await signInAnonymously(a)).user.uid;
}
