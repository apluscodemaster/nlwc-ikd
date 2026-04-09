import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Headphones } from "lucide-react";
import { getAudioSermonDetail } from "@/lib/audioSermons";
import AudioPlayerClient from "./AudioPlayerClient";

interface Props {
  params: Promise<{ id: string }>;
}

// ISR: cache for 5 minutes, regenerate in background
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sermon = await getAudioSermonDetail(parseInt(id));

  if (!sermon) {
    return {
      title: "Message Not Found | NLWC Ikorodu",
    };
  }

  const description = [
    sermon.speaker && `By ${sermon.speaker}`,
    sermon.series && `Series: ${sermon.series}`,
    sermon.date,
  ]
    .filter(Boolean)
    .join(" • ");

  return {
    title: `${sermon.title} | Audio Messages | NLWC Ikorodu`,
    description:
      description || `Listen to "${sermon.title}" from NLWC Ikorodu`,
    openGraph: {
      title: sermon.title,
      description:
        description || `Listen to "${sermon.title}" from NLWC Ikorodu`,
      type: "music.song",
      ...(sermon.thumbnailUrl && {
        images: [{ url: sermon.thumbnailUrl, width: 1080, height: 720 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: sermon.title,
      description:
        description || `Listen to "${sermon.title}" from NLWC Ikorodu`,
      ...(sermon.thumbnailUrl && { images: [sermon.thumbnailUrl] }),
    },
  };
}

export default async function AudioSermonPage({ params }: Props) {
  const { id } = await params;
  const sermon = await getAudioSermonDetail(parseInt(id));

  if (!sermon) {
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
