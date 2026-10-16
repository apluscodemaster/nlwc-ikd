import { NextRequest, NextResponse } from "next/server";
import { requireAuthActor } from "@/lib/auth";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { extractCoordinates, isGoogleMapsUrl } from "@/utils/mapCoordinates";

export const dynamic = "force-dynamic";

const MAX_REDIRECTS = 6;
/** Only the start of a Maps page is scanned for coordinates. */
const MAX_BODY_CHARS = 300_000;
// Google serves a stripped page (or a consent wall) to unknown clients;
// a normal browser UA gets the URL forms the parser understands.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

/**
 * POST /api/fellowship/resolve-map — body `{ url }`, admin only.
 *
 * Returns `{ lat, lng }` for a Google Maps link so the admin Fellowship form
 * can fill a center's coordinates from its map link. Short links
 * (maps.app.goo.gl) must be resolved server-side: the browser can't read a
 * cross-origin redirect. Every hop is checked against the Google Maps
 * allowlist, so this never fetches anything but Google Maps.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuthActor(request);
  if (auth.response) return auth.response;

  const limited = rateLimitMiddleware(request, "authenticated");
  if (limited) return limited;

  let url: unknown;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof url !== "string" || !isGoogleMapsUrl(url.trim())) {
    return NextResponse.json(
      { error: "Paste a Google Maps link (maps.app.goo.gl/… or google.com/maps/…)." },
      { status: 400 },
    );
  }

  let current = url.trim();
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const found = extractCoordinates(current);
      if (found) return NextResponse.json(found);

      const res = await fetch(current, {
        redirect: "manual",
        cache: "no-store",
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
        signal: AbortSignal.timeout(8000),
      });

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        const next = new URL(location, current).toString();
        if (!isGoogleMapsUrl(next)) break;
        current = next;
        continue;
      }

      // Final page: coordinates usually appear in its markup (canonical URL,
      // preview image "center=lat,lng", or a "!3d…!4d…" place reference).
      if (res.ok) {
        const html = (await res.text()).slice(0, MAX_BODY_CHARS);
        const fromPage = extractCoordinates(html);
        if (fromPage) return NextResponse.json(fromPage);
      }
      break;
    }
  } catch (err) {
    console.warn("[resolve-map] failed:", err);
    return NextResponse.json(
      { error: "Couldn't reach Google Maps. Try again, or enter the coordinates by hand." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      error:
        "No coordinates found in that link. Open it in Google Maps, make sure it points at a single place, and copy the share link again.",
    },
    { status: 422 },
  );
}
