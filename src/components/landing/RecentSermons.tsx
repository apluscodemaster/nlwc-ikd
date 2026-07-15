"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import SectionLabel from "@/components/shared/SectionLabel";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  ArrowRight,
  Headphones,
  X,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
  Download,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { useAudioSermons } from "@/hooks/useAudioSermons";
import { Skeleton } from "@/components/ui/skeleton";
import type { AudioSermon } from "@/lib/audioSermons";
import { useGlobalAudio } from "@/components/providers/GlobalAudioProvider";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function formatTime(time: number): string {
  if (!time || isNaN(time)) return "0:00";
  const totalSeconds = Math.floor(time);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function RecentSermons() {
  const { sermons, isLoading, error, fetchSermonDetail } = useAudioSermons({
    page: 1,
    perPage: 3,
    order: "DESC",
  });

  // Playback is owned by GlobalAudioProvider (root layout), so audio started
  // here survives navigating away from the homepage. This section only starts
  // tracks and reflects their state — the persistent bar and the full-screen
  // player are rendered by the provider.
  const audio = useGlobalAudio();
  const [loadingSermonId, setLoadingSermonId] = useState<number | null>(null);

  const handlePlay = useCallback(
    async (sermon: AudioSermon) => {
      // Same sermon → plain play/pause of the already-loaded element.
      if (audio.isCurrent(sermon.id)) {
        audio.toggle();
        return;
      }

      setLoadingSermonId(sermon.id);
      let sermonToPlay = sermon;

      // Fetch detail to get download URL if not available
      if (!sermon.downloadUrl) {
        const detail = await fetchSermonDetail(sermon.id);
        if (detail && detail.downloadUrl) {
          sermonToPlay = detail;
        } else {
          setLoadingSermonId(null);
          return;
        }
      }

      if (sermonToPlay.downloadUrl) {
        audio.play({
          id: sermonToPlay.id,
          title: sermonToPlay.title,
          speaker: sermonToPlay.speaker,
          series: sermonToPlay.series,
          thumbnailUrl: sermonToPlay.thumbnailUrl,
          src: sermonToPlay.downloadUrl,
          downloadUrl: sermonToPlay.downloadUrl,
          href: `/sermons/audio/${sermonToPlay.id}`,
        });
      }
      setLoadingSermonId(null);
    },
    [audio, fetchSermonDetail],
  );

  return (
    <section className="relative bg-white py-12 sm:py-32 overflow-hidden">
      {/* The <audio> element, transport controls and progress saving all live in
          GlobalAudioProvider now. */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={headingVariants}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6"
        >
          <div className="space-y-4 max-w-2xl">
            <SectionLabel>Recent Messages</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Spiritual <span className="text-primary">Nourishment</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Catch up on the latest messages and series from our pulpit.
              Available in video and audio formats.
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="rounded-full px-8 text-primary hover:text-primary hover:bg-primary/5"
          >
            <Link href="/sermons">
              View All Messages <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video rounded-3xl" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-muted-foreground">
            Failed to load recent sermons.
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-8"
          >
            {sermons.slice(0, 3).map((sermon) => {
              const isActive = audio.isCurrent(sermon.id);
              const isThisPlaying = isActive && audio.isPlaying;
              const isThisLoading = loadingSermonId === sermon.id;

              return (
                <motion.div
                  key={sermon.id}
                  variants={cardVariants}
                  whileHover={{ y: -5, transition: { duration: 0.3 } }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 shadow-md group-hover:shadow-2xl transition-all duration-500">
                    {sermon.thumbnailUrl ? (
                      <Image
                        src={sermon.thumbnailUrl}
                        alt={sermon.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Headphones className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Play Button - triggers audio playback */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePlay(sermon);
                      }}
                      className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
                      aria-label={
                        isThisPlaying
                          ? `Pause ${sermon.title}`
                          : `Play ${sermon.title}`
                      }
                    >
                      <div
                        className={`w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transform transition-transform duration-300 ${
                          isActive
                            ? "scale-100 ring-4 ring-primary/30"
                            : "scale-90 group-hover:scale-100"
                        }`}
                      >
                        {isThisLoading ? (
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        ) : isThisPlaying ? (
                          <Pause className="w-6 h-6 text-primary fill-primary" />
                        ) : (
                          <Play className="w-6 h-6 text-primary fill-primary ml-1" />
                        )}
                      </div>
                    </button>

                    {sermon.series && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-primary flex items-center gap-2 z-10">
                        <Headphones className="w-3 h-3" />
                        {sermon.series}
                      </div>
                    )}

                    {/* Active indicator / mini progress on card */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-10">
                        <motion.div
                          className="h-full bg-primary"
                          style={{
                            width: `${audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <Link href="/sermons">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-primary uppercase tracking-wider">
                        {sermon.date}
                      </p>
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                        {sermon.title}
                      </h3>
                      <p className="text-muted-foreground font-medium">
                        {sermon.speaker}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* The mini player and full-screen player now live in
          GlobalAudioProvider (root layout), so playback and its controls
          survive navigating away from the homepage. */}
    </section>
  );
}
