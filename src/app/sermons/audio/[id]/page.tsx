import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Headphones } from "lucide-react";
import { getAudioSermonDetail } from "@/lib/audioSermons";
import AudioPlayerClient from "./AudioPlayerClient";

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
      title: "Message Not Found | NLWC Ikorodu",
      description: "The requested audio message could not be found.",
    };
  }

  // Extract meaningful title — use actual title if available, otherwise generic but specific
  const hasTitle = sermon.title && !sermon.title.includes("Message #");
  const title = hasTitle
    ? sermon.title
    : `Audio Message ${sermon.id} | NLWC Ikorodu`;

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

  return {
    title: `${title} | NLWC Ikorodu`,
    description,
    openGraph: {
      title,
      description,
      type: "music.song",
      url: `https://ikorodu.nlwc.church/sermons/audio/${sermon.id}`,
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

  return <AudioPlayerClient initialSermon={sermon} />;
}
