import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://ikorodu.nlwc.church";

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/fellowship`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/give`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/live`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/listen-live`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/media`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/sermons`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/video-messages`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/devotionals`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/manuals`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/transcripts`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/salvation`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${baseUrl}/welcome`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  return staticRoutes;
}
