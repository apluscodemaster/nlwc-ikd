import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Expo app config. Three variants install side by side:
 *   development → church.nlwc.ikorodu.dev      "NLWC (Dev)"
 *   preview     → church.nlwc.ikorodu.preview  "NLWC (Preview)"
 *   production  → church.nlwc.ikorodu          "NLWC Ikorodu"
 * Set with APP_VARIANT (EAS build profiles set it; see eas.json).
 *
 * Runtime configuration uses EXPO_PUBLIC_* variables (see .env.example).
 * They are inlined into the JS bundle and are public by design.
 */
const VARIANT = (process.env.APP_VARIANT ?? "development") as
  | "development"
  | "preview"
  | "production";

const BASE_ID = "church.nlwc.ikorodu";
const id = VARIANT === "production" ? BASE_ID : `${BASE_ID}.${VARIANT === "preview" ? "preview" : "dev"}`;
const name =
  VARIANT === "production" ? "NLWC Ikorodu" : VARIANT === "preview" ? "NLWC (Preview)" : "NLWC (Dev)";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name,
  slug: "nlwc-ikorodu",
  scheme: "nlwcikd",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
    dark: { image: "./assets/images/splash-icon.png", backgroundColor: "#0B0B0F" },
  },
  ios: {
    bundleIdentifier: id,
    supportsTablet: true,
    infoPlist: {
      UIBackgroundModes: ["audio"],
      NSLocationWhenInUseUsageDescription:
        "Your location is used only to show the house fellowship centres nearest to you.",
      ITSAppUsesNonExemptEncryption: false,
    },
    associatedDomains: ["applinks:ikorodu.nlwc.church"],
  },
  android: {
    package: id,
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FF7C18",
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "POST_NOTIFICATIONS",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          { scheme: "https", host: "ikorodu.nlwc.church", pathPrefix: "/transcripts" },
          { scheme: "https", host: "ikorodu.nlwc.church", pathPrefix: "/manuals" },
          { scheme: "https", host: "ikorodu.nlwc.church", pathPrefix: "/sermons" },
          { scheme: "https", host: "ikorodu.nlwc.church", pathPrefix: "/video-messages" },
          { scheme: "https", host: "ikorodu.nlwc.church", pathPrefix: "/devotionals" },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-sqlite",
    "expo-web-browser",
    [
      "expo-audio",
      {
        microphonePermission: false,
        enableBackgroundPlayback: true,
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Your location is used only to show the house fellowship centres nearest to you.",
      },
    ],
    [
      "expo-notifications",
      {
        color: "#FF7C18",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: "#FFFFFF",
        dark: { backgroundColor: "#0B0B0F" },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true,
  },
  extra: {
    variant: VARIANT,
    eas: {
      // Filled in by `eas init`.
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
