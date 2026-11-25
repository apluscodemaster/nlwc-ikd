/**
 * The visitor's IP address, as reported by the hosting platform.
 *
 * Never trust the LEFT-most x-forwarded-for entry: the browser can send its
 * own x-forwarded-for header and the proxy only appends to it, so the first
 * entry is whatever the client chose. That made every rate limit bypassable
 * by sending a different made-up IP with each request.
 *
 * In order of trust:
 *  - x-nf-client-connection-ip: set by Netlify's edge, which overwrites any
 *    value the client sent.
 *  - the RIGHT-most x-forwarded-for entry: appended by the last proxy.
 *  - x-real-ip (local dev / other hosts).
 */
export function getClientIp(request: Pick<Request, "headers">): string | null {
  const netlify = request.headers.get("x-nf-client-connection-ip")?.trim();
  if (netlify) return netlify;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (hops.length) return hops[hops.length - 1];
  }
  return request.headers.get("x-real-ip")?.trim() || null;
}
