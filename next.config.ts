import type { NextConfig } from "next";

const WP_ORIGIN = "https://ikdadmin.nlwc.church";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // 301 redirects: reclaim ranking power from old WordPress URLs that may still be indexed.
  // These patterns are common on WordPress sites at this domain. Google will credit the new URLs.
  async redirects() {
    return [
      // Common WP category/tag archive pages → relevant Next.js equivalents
      { source: "/category/:slug*", destination: "/sermons", permanent: true },
      { source: "/tag/:slug*", destination: "/sermons", permanent: true },
      // Common WP blog post routes
      { source: "/blog/:slug*", destination: "/media", permanent: true },
      // WP page slugs that likely existed
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/gallery/:slug+", destination: "/gallery", permanent: true },
      { source: "/media/:slug+", destination: "/media", permanent: true },
      { source: "/giving", destination: "/give", permanent: true },
      { source: "/fellowship/:slug+", destination: "/fellowship", permanent: true },
      // WP query string style permalinks
      { source: "/index.php", destination: "/", permanent: true },
      // WP feeds
      { source: "/feed", destination: "/sitemap.xml", permanent: true },
      { source: "/feed/", destination: "/sitemap.xml", permanent: true },
    ];
  },

  // Ghost Proxy — transparently forward WP backend paths to the WordPress origin.
  // Now safe: WP lives on ikdadmin.nlwc.church, Vercel serves ikorodu.nlwc.church.
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
        hostname: "photos.google.com",
      },
      {
        protocol: "https",
        hostname: "photos.app.goo.gl",
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
        hostname: "ikdadmin.nlwc.church",
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

  // Security headers including Content Security Policy
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Content Security Policy to prevent XSS attacks
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.youtube.com cdn.jsdelivr.net cdn.raindrop.io unpkg.com *.google.com *.gstatic.com *.googleapis.com *.googletagmanager.com api.reftagger.com; " +
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com *.cloudinary.com www.gstatic.com; " +
              "img-src 'self' data: https: blob:; " +
              "font-src 'self' data: fonts.gstatic.com; " +
              "connect-src 'self' *.youtube.com *.google.com *.gstatic.com *.googleapis.com *.googletagmanager.com *.firebase.com *.firebaseio.com *.firebaseapp.com *.supabase.co *.cloudinary.com ikdadmin.nlwc.church one.com; " +
              "frame-src 'self' *.youtube.com *.google.com *.gstatic.com *.waystream.io; " +
              "media-src 'self' https: blob:; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'",
          },
          // Prevent X-Frame-Options (clickjacking) attacks
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Enable XSS protection in older browsers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer policy for privacy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permission policy (feature policy)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
