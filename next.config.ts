import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: WP rewrite proxy removed — it caused a 508 Infinite Loop because
  // the rewrite destination (ikorodu.nlwc.church) is the same domain Vercel
  // serves this app on, so every rewrite hit Vercel again in an endless cycle.
  //
  // To re-enable wp-admin proxying, point WP_ORIGIN to a DIFFERENT host, e.g.:
  //   const WP_ORIGIN = "https://wp.ikorodu.nlwc.church";  // dedicated WP subdomain
  //   const WP_ORIGIN = "https://your-server-ip-or-cpanel-domain";  // direct server
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "ikorodu.nlwc.church",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "nlwc-ikorodu.s3.us-east-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
