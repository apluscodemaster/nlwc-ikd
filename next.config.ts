import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/d/**",
      },
    ],

    domains: ["drive.google.com", "lh3.googleusercontent.com"],
  },
};

export default nextConfig;
