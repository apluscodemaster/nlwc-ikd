/**
 * Coordinates from Google Maps links — used to fill a fellowship center's
 * latitude/longitude from its map link instead of typing them by hand (hand-
 * typed values had drifted kilometres from the real centers, which made the
 * "nearest center" prompt recommend the wrong one).
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance in km. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Whether `url` is a Google Maps link (short or full). Also the allowlist for
 * which hosts the server will follow redirects to, so this can't be used to
 * make the server fetch arbitrary URLs.
 */
export function isGoogleMapsUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "maps.app.goo.gl") return true;
  if (host === "goo.gl") return u.pathname.startsWith("/maps");
  if (/^maps\.google\.[a-z.]+$/.test(host)) return true;
  if (/^(www\.)?google\.[a-z.]+$/.test(host)) {
    return u.pathname.startsWith("/maps");
  }
  // Google's cookie-consent interstitial, which wraps the real maps URL.
  if (host === "consent.google.com") return true;
  return false;
}

function valid(lat: number, lng: number): LatLng | null {
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  ) {
    return { lat, lng };
  }
  return null;
}

const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

/**
 * Coordinates encoded in a Google Maps URL (or text containing one), most
 * precise first:
 *   1. `!3d<lat>!4d<lng>` — the place's own pin (what the link points at);
 *   2. `?q=` / `query=` / `ll=` / `center=` / `destination=` "lat,lng";
 *   3. `@<lat>,<lng>` — only the map VIEW's centre, which can be well off
 *      the place (it is what you were looking at, not what you picked).
 * A consent-interstitial URL is unwrapped via its `continue` parameter.
 */
export function extractCoordinates(text: string): LatLng | null {
  let s = text;
  try {
    const u = new URL(text);
    if (u.hostname === "consent.google.com") {
      const inner = u.searchParams.get("continue");
      if (inner) return extractCoordinates(inner);
    }
    s = decodeURIComponent(text);
  } catch {
    // Not a single URL (e.g. HTML) — scan it as-is, plus a decoded copy.
    try {
      s = `${text} ${decodeURIComponent(text)}`;
    } catch {
      /* keep raw */
    }
  }

  // 1. Place pin. A URL can carry more than one (e.g. directions); the last
  //    one is the selected place.
  const pins = [...s.matchAll(new RegExp(`!3d${NUM}!4d${NUM}`, "g"))];
  for (const m of pins.reverse()) {
    const c = valid(Number(m[1]), Number(m[2]));
    if (c) return c;
  }

  // 2. Explicit coordinate parameters.
  const param = s.match(
    new RegExp(
      `[?&](?:q|query|ll|center|destination|daddr)=(?:loc:)?${NUM}\\s*,\\s*${NUM}`,
    ),
  );
  if (param) {
    const c = valid(Number(param[1]), Number(param[2]));
    if (c) return c;
  }

  // 3. Viewport centre.
  const at = s.match(new RegExp(`@${NUM},${NUM}`));
  if (at) {
    const c = valid(Number(at[1]), Number(at[2]));
    if (c) return c;
  }

  return null;
}
