/**
 * Runtime configuration from EXPO_PUBLIC_* variables (inlined at build time).
 * See .env.example and docs/ARCHITECTURE.md §8.
 */
import Constants from "expo-constants";

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export const API_BASE_URL = trimSlash(process.env.EXPO_PUBLIC_API_BASE_URL || "https://ikorodu.nlwc.church");

export const SITE_URL = trimSlash(process.env.EXPO_PUBLIC_SITE_URL || "https://ikorodu.nlwc.church");

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** Chat and the testimonies feed need Firestore; hidden gracefully without it. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";
export const APP_VARIANT = (Constants.expoConfig?.extra?.variant as string | undefined) ?? "development";

/** Identifies the app in server logs and rate limits. */
export const CLIENT_HEADER = { "X-Client": `nlwc-mobile/${APP_VERSION}` } as const;

/**
 * Church contact details, as published on the website (src/app/layout.tsx
 * JSON-LD, ObfuscatedContact, ContactInfo, Footer).
 */
export const CHURCH = {
  name: "The New & Living Way Church, Ikorodu",
  shortName: "NLWC Ikorodu",
  email: "ikoroduchurchadmin@nlwc.church",
  phone: "+2348137436770",
  phoneDisplay: "+234 813 743 6770",
  whatsappNumber: "2348137436770",
  whatsapp: "https://wa.me/2348137436770",
  /** House fellowship coordinator (fellowship page). */
  fellowshipWhatsapp: "https://wa.me/2347066644051",
  address:
    "15, Alhaji Jimoh Olosugbo Close, Off Kokoro Abu Street, Grammar School Bus Stop, Off Obafemi Awolowo way, Ikorodu.",
  social: {
    facebook: "https://facebook.com/nlwclife",
    x: "https://x.com/nlwclife",
    instagram: "https://www.instagram.com/nlwclife/",
    youtube: "https://www.youtube.com/@nlwclife",
  },
  blog: "https://nlwc.church/blog/",
} as const;

export function whatsappLink(message?: string): string {
  return message ? `https://wa.me/${CHURCH.whatsappNumber}?text=${encodeURIComponent(message)}` : CHURCH.whatsapp;
}
