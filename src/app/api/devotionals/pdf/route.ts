import { NextRequest, NextResponse } from "next/server";
import { perQueryCache } from "@/lib/cacheHeaders";
import { rateLimitMiddleware } from "@/lib/rateLimit";

/**
 * GET /api/devotionals/pdf?src=<pdfUrl>
 *
 * Serves a devotional PDF from this site's own origin so the in-page viewer
 * (PDF.js, components/devotionals/PdfViewer) can read it: a browser may only
 * read a file from another site when that site sends CORS headers, and the S3
 * bucket doesn't. Only the church's own devotional files can be fetched, so
 * this is not an open proxy. Responses are cached at Vercel's edge (the URL
 * carries a version, so a replaced PDF gets a new one).
 */
const ALLOWED = [
  /^https:\/\/nlwc-ikorodu\.s3\.us-east-2\.amazonaws\.com\/Daily_Devotionals\/[^?#]+\.pdf(\?v=\d+)?$/i,
  // Devotionals uploaded before the move to S3.
  /^https:\/\/res\.cloudinary\.com\/dj7rh8h6r\/image\/upload\/[^?#]+\.pdf$/i,
];
const MAX_BYTES = 25 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const limited = await rateLimitMiddleware(req, "public");
  if (limited) return limited;

  const src = req.nextUrl.searchParams.get("src") ?? "";
  if (!ALLOWED.some((re) => re.test(src))) {
    return NextResponse.json(
      { error: "Not a devotional PDF" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(src, { signal: AbortSignal.timeout(20_000) });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Couldn't load the PDF (${upstream.status})` },
        { status: 502 },
      );
    }
    const size = Number(upstream.headers.get("content-length") ?? 0);
    if (size > MAX_BYTES) {
      return NextResponse.json({ error: "PDF too large" }, { status: 413 });
    }
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "application/pdf",
        ...(size ? { "Content-Length": String(size) } : {}),
        "Cache-Control": perQueryCache(86400),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't load the PDF" },
      { status: 502 },
    );
  }
}
