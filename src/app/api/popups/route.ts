import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rateLimit";
import { listPopups } from "@/lib/popupStore.server";
import { BUILT_IN_POPUPS, isWithinDates, type SitePopup } from "@/lib/sitePopups";

export const dynamic = "force-dynamic";

/** What the browser needs to show a pop-up (no admin-only fields). */
function publicFields(p: SitePopup): Partial<SitePopup> {
  const out: Partial<SitePopup> = { ...p };
  delete out.name;
  delete out.createdAt;
  delete out.updatedAt;
  return out;
}

/**
 * GET /api/popups — public: the pop-ups that are switched on and within their
 * dates (components/popups/SitePopups decides page, timing and frequency).
 * Cached at the CDN for a minute; it takes no query parameters, so the
 * Netlify cache-key issue (lib/cacheHeaders) doesn't apply. If Firestore
 * can't be read, the three built-in pop-ups are returned so they keep running.
 */
export async function GET(req: NextRequest) {
  const limited = await rateLimitMiddleware(req, "public");
  if (limited) return limited;

  let popups: SitePopup[];
  let fallback = false;
  try {
    popups = await listPopups();
  } catch (err) {
    console.error("[popups] Firestore read failed, using built-in defaults:", err);
    popups = BUILT_IN_POPUPS;
    fallback = true;
  }
  const now = new Date();
  const live = popups.filter((p) => p.active && isWithinDates(p, now)).map(publicFields);
  return NextResponse.json(
    { popups: live },
    {
      headers: {
        "Cache-Control": fallback ? "no-store" : "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
