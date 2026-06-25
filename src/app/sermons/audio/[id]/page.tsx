import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Headphones } from "lucide-react";
import { getAudioSermonDetail } from "@/lib/audioSermons";
import AudioPlayerClient from "./AudioPlayerClient";
import JsonLd from "@/components/seo/JsonLd";
import {
  SITE_URL,
  PUBLISHER,
  stripHtml,
  metaDescription,
  toIsoDate,
  parseDurationToISO,
} from "@/utils/seo";

interface Props {
  params: Promise<{ id: string }>;
}

// ISR: cache for 1 hour (audio sermons rarely change)
// After 1 hour, next request triggers background regeneration
// This reduces Vercel CPU costs significantly
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sermon = await getAudioSermonDetail(parseInt(id));

  // If we couldn't get any sermon data at all (shouldn't happen with new fallback)
  if (!sermon) {
    return {
      title: "Message Not Found",
      description: "The requested audio message could not be found.",
    };
  }

  // Extract meaningful title — use actual title if available, otherwise generic but specific
  const hasTitle = sermon.title && !sermon.title.includes("Message #");
  const title = hasTitle ? sermon.title : `Audio Message ${sermon.id}`;

  // Build description from available metadata
  const descriptionParts = [
    sermon.speaker && `By ${sermon.speaker}`,
    sermon.series && `Series: ${sermon.series}`,
    sermon.date,
  ].filter(Boolean);

  const description =
    descriptionParts.length > 0
      ? descriptionParts.join(" • ")
      : `Listen to message #${sermon.id} from NLWC Ikorodu`;

  const url = `${SITE_URL}/sermons/audio/${sermon.id}`;

  return {
    title: `${title}`,
    description,
    keywords: [
      stripHtml(title),
      "audio message",
      "sermon",
      "NLWC Ikorodu",
      ...(sermon.speaker ? [sermon.speaker] : []),
      ...(sermon.series ? [sermon.series] : []),
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "music.song",
      url,
      ...(sermon.thumbnailUrl && {
        images: [{ url: sermon.thumbnailUrl, width: 1080, height: 720 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(sermon.thumbnailUrl && { images: [sermon.thumbnailUrl] }),
    },
  };
}

export default async function AudioSermonPage({ params }: Props) {
  const { id } = await params;
  const sermon = await getAudioSermonDetail(parseInt(id));

  // The fallback system ensures we always get a sermon object with at least
  // an ID and listen URL, even if detailed metadata is unavailable
  if (!sermon) {
    // This should theoretically never happen, but kept as a safety net
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Headphones className="w-12 h-12 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Message Not Found
        </h1>
        <p className="text-gray-500 mb-8">
          This audio message could not be found.
        </p>
        <Link
          href="/sermons"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:scale-105 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse All Messages
        </Link>
      </main>
    );
  }

  const hasTitle = sermon.title && !sermon.title.includes("Message #");
  const ldTitle = stripHtml(
    hasTitle ? sermon.title : `Audio Message ${sermon.id}`,
  );
  const ldUrl = `${SITE_URL}/sermons/audio/${sermon.id}`;
  const audioLd = {
    "@context": "https://schema.org",
    "@type": "AudioObject",
    name: ldTitle,
    description: metaDescription(
      [
        sermon.speaker && `By ${sermon.speaker}`,
        sermon.series && `Series: ${sermon.series}`,
        sermon.date,
      ]
        .filter(Boolean)
        .join(" • ") || `Listen to "${ldTitle}" from NLWC Ikorodu.`,
    ),
    contentUrl: sermon.listenUrl,
    uploadDate: toIsoDate(sermon.date),
    duration: parseDurationToISO(sermon.duration),
    thumbnailUrl: sermon.thumbnailUrl,
    creator: sermon.speaker
      ? { "@type": "Person", name: sermon.speaker }
      : undefined,
    isPartOf: sermon.series
      ? { "@type": "CreativeWorkSeries", name: sermon.series }
      : undefined,
    publisher: PUBLISHER,
    inLanguage: "en",
    url: ldUrl,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Audio Messages",
        item: `${SITE_URL}/sermons`,
      },
      { "@type": "ListItem", position: 3, name: ldTitle, item: ldUrl },
    ],
  };

  return (
    <>
      <JsonLd data={[audioLd, breadcrumbLd]} />
      <AudioPlayerClient initialSermon={sermon} />
    </>
  );
}
