"use client";

// Note: This is a client component with dynamic filters,
// so ISR revalidate doesn't apply. Client-side fetching with
// HTTP Cache-Control headers handles cache management.

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import MediaFilters from "@/components/media/MediaFilters";
import ResourceList from "@/components/media/ResourceList";
import { useAudioSermons } from "@/hooks/useAudioSermons";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Headphones,
  FileText,
  BookOpen,
  Heart,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MediaItem {
  id: string;
  title: string;
  speaker: string;
  date: string;
  thumbnail?: string;
  type: "audio" | "video";
  href: string;
}

interface VideoMessage {
  id: string;
  title?: string;
  minister?: string;
  date: string;
  youtubeUrl: string;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────
async function fetchVideoMessages(): Promise<VideoMessage[]> {
  const res = await fetch("/api/video-messages");
  if (!res.ok) throw new Error("Failed to fetch video messages");
  const data = await res.json();
  return data.messages ?? [];
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function LiveMediaCard({ item }: { item: MediaItem }) {
  const thumb =
    item.thumbnail ||
    (item.type === "video"
      ? `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`
      : undefined);

  return (
    <Link href={item.href}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="group cursor-pointer"
      >
        <div className="relative aspect-video rounded-3xl overflow-hidden mb-4 shadow-md group-hover:shadow-2xl transition-all duration-500 bg-gray-100">
          {thumb ? (
            <Image
              src={thumb}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Headphones className="w-12 h-12 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

          {/* Badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-primary flex items-center gap-1.5 uppercase tracking-widest shadow-lg">
            {item.type === "video" ? (
              <Play className="w-3 h-3" />
            ) : (
              <Headphones className="w-3 h-3" />
            )}
            {item.type}
          </div>

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
              <Play className="w-6 h-6 text-primary fill-primary ml-1" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-black text-primary uppercase tracking-widest">
            {item.date}
          </p>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">{item.speaker}</p>
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function MediaSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MediaPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Real audio sermons — WordPress / S3
  const {
    sermons: audioSermons,
    isLoading: audioLoading,
    error: audioError,
  } = useAudioSermons({ page: 1, perPage: 6, order: "DESC" });

  // Real video messages — Google Sheets / WordPress
  const {
    data: rawVideos = [],
    isLoading: videoLoading,
    error: videoError,
  } = useQuery({
    queryKey: ["video-messages"],
    queryFn: fetchVideoMessages,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = audioLoading || videoLoading;
  const hasError = !isLoading && Boolean(audioError || videoError);

  // Merge: top 3 video + top 3 audio = up to 6 blended cards
  const allMedia = useMemo((): MediaItem[] => {
    const audioItems: MediaItem[] = audioSermons.map((s) => ({
      id: String(s.id),
      title: s.title,
      speaker: s.speaker,
      date: s.date,
      thumbnail: s.thumbnailUrl,
      type: "audio",
      href: "/sermons",
    }));

    const videoItems: MediaItem[] = rawVideos.map((v) => ({
      id: v.id,
      title: v.title || "Video Message",
      speaker: v.minister || "NLWC Ikorodu",
      date: v.date,
      type: "video",
      href: "/video-messages",
    }));

    return [...videoItems.slice(0, 3), ...audioItems.slice(0, 3)];
  }, [audioSermons, rawVideos]);

  // Filter
  const filteredMedia = useMemo(() => {
    return allMedia.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.speaker.toLowerCase().includes(q);
      const matchesTab = activeTab === "all" || item.type === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [allMedia, activeTab, searchQuery]);

  // Resources section — links to real app pages
  const contentSections = [
    {
      icon: FileText,
      label: "Message Transcripts",
      description:
        "Read full written transcripts of Sunday messages, Bible studies, and special teachings.",
      href: "/transcripts",
      iconBg: "bg-blue-50 text-blue-600",
      image:
        "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247564/nlwc-ikd-assets/zaxi2cv9e51ooer7uvrl.jpg",
    },
    {
      icon: BookOpen,
      label: "Sunday School Manuals",
      description:
        "Download quarterly study manuals used in our Sunday School and group Bible study sessions.",
      href: "/manuals",
      iconBg: "bg-amber-50 text-amber-600",
      image:
        "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247566/nlwc-ikd-assets/zeyif8gq4lxoxw06iull.avif",
    },
    {
      icon: Heart,
      label: "Daily Devotionals",
      description:
        "Start each day with a word from God. Browse our full devotional archive anytime.",
      href: "/devotionals",
      iconBg: "bg-primary/10 text-primary",
      image:
        "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <main>
      <PageHeader
        title="Media Resources"
        subtitle="Grow in your faith with our collection of sermon videos, audio messages, and spiritual study resources."
        backgroundImage="https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247833/nlwc-ikd-assets/ygkueoffnv3wvqy4d7ir.avif"
      />

      <SectionContainer>
        <div className="space-y-12">
          <MediaFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <AnimatePresence mode="wait">
            {activeTab === "resources" ? (
              <ResourceList key="resources" />
            ) : isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MediaSkeleton />
              </motion.div>
            ) : hasError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-red-50/40 rounded-3xl border border-red-100"
              >
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-gray-600 font-medium">
                  Could not load media at this time. Please try again later.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredMedia.map((item) => (
                  <LiveMediaCard key={`${item.type}-${item.id}`} item={item} />
                ))}

                {filteredMedia.length === 0 && (
                  <div className="col-span-full py-32 text-center bg-gray-50 rounded-3xl border border-dashed text-muted-foreground">
                    <p className="text-xl font-medium">
                      No results found matching your search.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setActiveTab("all");
                      }}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SectionContainer>

      {/* ── Spiritual Resources ───────────────────────────────────────────── */}
      <SectionContainer className="bg-gray-50">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h4 className="text-primary font-bold uppercase tracking-widest text-sm mb-3">
            — MORE FROM US
          </h4>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Spiritual <span className="text-primary">Resources</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Curated materials to help you dig deeper into the Word, grow in
            your faith, and keep the fire burning every day.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {contentSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white border border-gray-100 hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={section.image}
                    alt={section.label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div
                    className={`absolute top-4 left-4 w-10 h-10 rounded-2xl ${section.iconBg} flex items-center justify-center shadow-md`}
                  >
                    <section.icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-6 space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors flex items-center gap-2">
                    {section.label}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </SectionContainer>
    </main>
  );
}
