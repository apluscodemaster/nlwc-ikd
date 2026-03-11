"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import LivePlayer from "@/components/live/LivePlayer";
import ServiceCountdown from "@/components/live/ServiceCountdown";
import Image from "next/image";
import {
  ArrowRight,
  Play,
  Calendar,
  User,
  Youtube,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoMessage {
  date: string;
  youtubeUrl: string;
  title?: string;
  minister?: string;
  id: string;
}

async function fetchVideoMessages(): Promise<VideoMessage[]> {
  const response = await fetch("/api/video-messages");
  if (!response.ok) throw new Error("Failed to fetch video messages");
  const data = await response.json();
  return data.messages;
}

export default function LivePage() {
  const {
    data: videos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["video-messages"],
    queryFn: fetchVideoMessages,
    staleTime: 5 * 60 * 1000,
  });

  const [selectedVideo, setSelectedVideo] = useState<VideoMessage | null>(null);

  // Scroll to top on mount — delayed so it runs after Next.js scroll restoration.
  // Skip when a #hash is present (e.g. /live#live-player from the listen-live page).
  useEffect(() => {
    if (window.location.hash) return;
    // Use a small timeout + rAF to run after Next.js scroll restoration
    const timeout = setTimeout(() => {
      requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }),
      );
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

  const recentVideos = videos.slice(0, 3);

  return (
    <main>
      <PageHeader
        title="Video Broadcast"
        subtitle="Experience the glory in high definition. Watch our live services and special events from anywhere in the world."
        backgroundImage="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer id="live-player" className="pb-8 sm:pb-12">
        <LivePlayer />
      </SectionContainer>

      <SectionContainer className="bg-gray-50 overflow-hidden pt-10 sm:pt-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
                — VIDEO EXPERIENCE
              </h4>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                Immersive <br className="hidden sm:block" />
                <span className="text-primary">Live Worship</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Join our visual broadcast for a multi-camera production that
                brings the sanctuary environment directly to your home. Best
                enjoyed on large screens.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href="/welcome"
                className="inline-flex items-center justify-center h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-linear-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform text-sm sm:text-base gap-2 group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                First Timer?
              </Link>
              {/* <button className="h-12 sm:h-14 px-8 sm:px-10 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-sm sm:text-base">
                Set Reminder
              </button> */}
              <Link
                href="/listen-live"
                className="inline-flex items-center justify-center h-12 sm:h-14 px-8 sm:px-10 rounded-full border border-gray-100 bg-white font-bold hover:bg-gray-50 transition-all text-sm sm:text-base"
              >
                Switch to Audio
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-[40px] transform md:-rotate-3 scale-100 md:scale-105" />
            <div className="relative bg-white p-5 sm:p-12 rounded-[40px] shadow-xl border border-gray-100">
              <ServiceCountdown />
            </div>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — RECENT BROADCASTS
            </h4>
            <h2 className="text-3xl font-bold text-gray-900">
              Experience Archives
            </h2>
          </div>
          <Link
            href="/video-messages"
            className="inline-flex items-center gap-2 text-primary font-bold group"
          >
            View Full Archive
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video rounded-3xl" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-muted-foreground">
            Failed to load recent video messages.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {recentVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.3 } }}
                className="group relative flex flex-col bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-gray-900">
                  <Image
                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                    alt={video.title || "Video thumbnail"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300 shadow-xl">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                          {video.date}
                        </span>
                      </div>
                      {video.minister && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                          <User className="w-3 h-3" />
                          {video.minister}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {video.title}
                    </h3>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                      Video Message
                    </span>
                    <Youtube className="w-5 h-5 text-gray-300 group-hover:text-red-600 transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </SectionContainer>

      {/* ===== VIDEO PLAYER MODAL ===== */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-0 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-none sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90 border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideo.title}
                className="w-full h-full border-none relative z-10"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />

              {/* Info Overlay */}
              <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-linear-to-t from-black/80 to-transparent pointer-events-none z-20">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                      Now Playing
                    </span>
                    <span className="text-white/60 text-sm font-medium">
                      {selectedVideo.date} • {selectedVideo.minister}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {selectedVideo.title}
                  </h2>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
