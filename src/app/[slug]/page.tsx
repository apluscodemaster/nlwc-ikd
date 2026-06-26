import { notFound, permanentRedirect } from "next/navigation";
import { getAudioSermons, getAudioSermonBySlug } from "@/lib/audioSermons";
import {
  getTranscriptBySlug,
  getManualBySlug,
  getMessageTranscriptBySlug,
} from "@/lib/wordpress";

// Catch-all for legacy root-level WordPress permalinks ("/<slug>") that now
// live under a section prefix. Resolves the slug and 301s to the new URL.
//
// This only runs for single-segment paths that don't match a static route
// (/about, /sermons, …) or a metadata/static file — those take precedence.
// Resolutions are cached for a day so re-crawls don't re-query the backend.
export const revalidate = 86400;

// Only treat clean WordPress-style slugs as content; anything else (file
// extensions, scanner probes, mixed case) 404s immediately with no backend
// calls.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface Props {
  params: Promise<{ slug: string }>;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function resolveDestination(slug: string): Promise<string | null> {
  // 1) Transcript (regular posts) — the most common old root permalink.
  try {
    if (await getTranscriptBySlug(slug)) return `/transcripts/${slug}`;
  } catch {
    // ignore and try the next source
  }

  // 2) Message transcript (custom post type).
  try {
    if (await getMessageTranscriptBySlug(slug)) return `/sermons/${slug}`;
  } catch {
    // ignore and try the next source
  }

  // 3) Sunday School manual.
  try {
    if (await getManualBySlug(slug)) return `/manuals/${slug}`;
  } catch {
    // ignore and try the next source
  }

  // 4) Audio message → numeric id. Exact slug lookup first (once the WP API
  //    exposes ?slug=), then a search-based fallback.
  try {
    const exact = await getAudioSermonBySlug(slug);
    if (exact?.id) return `/sermons/audio/${exact.id}`;

    const target = normalize(slug);
    const { data } = await getAudioSermons({
      search: slug.replace(/-/g, " "),
      perPage: 50,
    });
    const hit = data.find(
      (s) => s.slug === slug || (s.title && normalize(s.title) === target),
    );
    if (hit?.id) return `/sermons/audio/${hit.id}`;
  } catch {
    // ignore — fall through to 404
  }

  return null;
}

export default async function LegacyRootRedirect({ params }: Props) {
  const { slug } = await params;

  if (!SLUG_RE.test(slug) || slug.length > 200) notFound();

  const destination = await resolveDestination(slug);
  if (!destination) notFound();

  // Outside any try/catch — permanentRedirect throws a control-flow signal.
  permanentRedirect(destination);
}
