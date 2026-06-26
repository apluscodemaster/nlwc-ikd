import { permanentRedirect } from "next/navigation";
import { getAudioSermons } from "@/lib/audioSermons";
import {
  getMessageTranscriptBySlug,
  getTranscriptBySlug,
} from "@/lib/wordpress";

// Resolve legacy WordPress "/messages/<slug>" permalinks to the new URLs and
// 301 (permanent) so Google credits the destination. Cache each resolution for
// a day so re-crawls don't re-query the backend.
export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

// Normalise to bare alphanumerics so slug ↔ title comparison is robust to
// hyphens, apostrophes, ampersands and other punctuation differences between
// WordPress' slug rules and ours.
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function resolveDestination(slug: string): Promise<string> {
  const target = normalize(slug);

  // 1) Audio message — old /messages/<slug> usually maps to an audio sermon,
  //    which is addressable only by numeric id in the new app. Search by the
  //    slug-as-phrase, then require an exact normalised title match.
  try {
    const phrase = slug.replace(/-/g, " ");
    const { data } = await getAudioSermons({ search: phrase, perPage: 50 });
    const hit = data.find((s) => s.title && normalize(s.title) === target);
    if (hit?.id) return `/sermons/audio/${hit.id}`;
  } catch {
    // Sermon API unavailable — fall through to the transcript routes.
  }

  // 2) Message transcript (custom post type) at the same slug.
  try {
    if (await getMessageTranscriptBySlug(slug)) return `/sermons/${slug}`;
  } catch {
    // ignore and try the next source
  }

  // 3) Regular transcript post at the same slug.
  try {
    if (await getTranscriptBySlug(slug)) return `/transcripts/${slug}`;
  } catch {
    // ignore and fall back below
  }

  // 4) Nothing matched — send legacy traffic to the audio messages hub.
  return "/sermons";
}

export default async function LegacyMessageRedirect({ params }: Props) {
  const { slug } = await params;
  const destination = await resolveDestination(slug);
  // Must run outside try/catch — permanentRedirect throws a control-flow signal
  // that Next needs to propagate.
  permanentRedirect(destination);
}
