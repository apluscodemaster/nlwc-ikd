import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://ikorodu.nlwc.church"}/sitemap.xml`,
  };
}
