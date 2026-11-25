/**
 * Cache-Control for API responses that depend on the query string.
 *
 * The live site runs on Netlify, whose CDN cache key ignores query parameters
 * (its Next.js runtime sets Netlify-Vary to only __nextDataReq/_rsc). With a
 * shared-cache directive (s-maxage), the first response for e.g.
 * /api/audio-sermons?message_id=672 was served for EVERY query: every sermon,
 * every page of the list, every Bible search. So these responses are cached
 * only by the visitor's browser, which keys on the full URL. The server's data
 * cache (fetch revalidate in lib/*) still spares WordPress and the Bible API.
 *
 * Use plain `public, s-maxage=…` only for responses that never read the query.
 */
export function perQueryCache(maxAgeSeconds: number): string {
  return `private, max-age=${maxAgeSeconds}`;
}
