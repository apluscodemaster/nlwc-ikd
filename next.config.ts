import type { NextConfig } from "next";

const WP_ORIGIN = "https://ikorodu.nlwc.church";

const nextConfig: NextConfig = {
  // Ghost Proxy — transparently forward WP backend paths to the WordPress origin.
  // Using "afterFiles" ensures Next.js filesystem routes (/admin/*) always win.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: "/wp-login.php",
          destination: `${WP_ORIGIN}/wp-login.php`,
        },
        {
          source: "/wp-admin",
          destination: `${WP_ORIGIN}/wp-admin`,
        },
        {
          source: "/wp-admin/:path*",
          destination: `${WP_ORIGIN}/wp-admin/:path*`,
        },
        {
          source: "/wp-includes/:path*",
          destination: `${WP_ORIGIN}/wp-includes/:path*`,
        },
        {
          source: "/wp-content/:path*",
          destination: `${WP_ORIGIN}/wp-content/:path*`,
        },
      ],
      fallback: [],
    };
  },
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
