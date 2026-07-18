import type { MetadataRoute } from "next";

/**
 * Web app manifest (served at /manifest.webmanifest).
 *
 * This did not exist before — the app registered a service worker (/sw.js) but
 * shipped no manifest, so an installed / "Add to Home Screen" instance had no
 * proper icons to use and fell back to stretching a non-square wordmark (the
 * "512x512" files were actually 512x221), which is what made the PWA logo look
 * blurry. The icons below are genuine SQUARE PNGs (see public/icons), including
 * a maskable variant with an 80% safe zone for Android's adaptive icons.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The New & Living Way Church, Ikorodu",
    short_name: "NLWC Ikorodu",
    description:
      "Sermons, daily devotionals, live services and more from The New & Living Way Church, Ikorodu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#FF7C18",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
