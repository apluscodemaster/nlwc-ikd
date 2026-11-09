/**
 * CDN caching for the gallery API routes (/api/sheet, /api/autoscroll-gallery).
 *
 * They render on demand rather than at build time and are cached at the edge
 * for 10 minutes. While some Google Photos links are still being resolved
 * (see lib/photoLinkCache), the response is cached for only a minute, so the
 * missing images fill in quickly instead of staying out for 10 minutes.
 *
 * `CDN-Cache-Control` / `Netlify-CDN-Cache-Control` are read by Vercel's and
 * Netlify's CDNs respectively; plain `Cache-Control` covers everything else.
 */
export function galleryCacheHeaders(pending: number): Record<string, string> {
  const seconds = pending > 0 ? 60 : 600;
  const value = `public, s-maxage=${seconds}, stale-while-revalidate=3600`;
  return {
    "Cache-Control": value,
    "CDN-Cache-Control": value,
    "Netlify-CDN-Cache-Control": `public, durable, s-maxage=${seconds}, stale-while-revalidate=3600`,
  };
}
