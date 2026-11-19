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

/** The EAS project this app builds in. Paste the ID `npx eas-cli init` prints. */
const EAS_PROJECT_ID = "";
const id = VARIANT === "production" ? BASE_ID : `${BASE_ID}.${VARIANT === "preview" ? "preview" : "dev"}`;
const name =
  VARIANT === "production" ? "NLWC Ikorodu" : VARIANT === "preview" ? "NLWC (Preview)" : "NLWC (Dev)";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name,
  slug: "nlwc-ikorodu",
  // Phone-only: the website is the web client. Without this, opening the dev
  // server URL in a browser triggers a web build that can't resolve
  // react-native-web.
  platforms: ["ios", "android"],
  scheme: "nlwcikd",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: id,
    // Opaque: iOS renders a transparent icon's background as black.
    icon: "./assets/images/icon-ios.png",
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
    // Windows: keep native (CMake) object paths under 260 chars.
    "./plugins/withCmakeObjectPathMax",
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
        // Round emblem on a square canvas: Android 12+ masks the splash icon to
        // a circle, which trimmed the wide wordmark. In dark mode the emblem sits
        // on a white disc so its dark artwork stays visible
        // (scripts/make-brand-assets.mjs).
        image: "./assets/images/splash-emblem.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#FFFFFF",
        dark: { image: "./assets/images/splash-emblem-dark.png", backgroundColor: "#0B0B0F" },
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
      // From `npx eas-cli init` (see README, "Cloud builds"). The env var wins
      // so a fork can point at its own EAS project.
      projectId: process.env.EAS_PROJECT_ID || EAS_PROJECT_ID || undefined,
    },
  },
});
