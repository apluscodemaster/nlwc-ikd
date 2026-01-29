"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import LivePlayer from "@/components/live/LivePlayer";
import ServiceCountdown from "@/components/live/ServiceCountdown";
import { recentSermons } from "@/data/sermons";
import MediaCard from "@/components/media/MediaCard";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LivePage() {
  const archives = recentSermons.filter((s) => s.type === "video").slice(0, 3);

  return (
    <main>
      <PageHeader
        title="Video Broadcast"
        subtitle="Experience the glory in high definition. Watch our live services and special events from anywhere in the world."
        backgroundImage="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer className="pb-10">
        <LivePlayer />
      </SectionContainer>

      <SectionContainer className="bg-gray-50 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
                — VIDEO EXPERIENCE
              </h4>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                Immersive <br />
                <span className="text-primary">Live Worship</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join our visual broadcast for a multi-camera production that
                brings the sanctuary environment directly to your home. Best
                enjoyed on large screens.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="h-14 px-10 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                Set Reminder
              </button>
              <Link
                href="/listen-live"
                className="inline-flex items-center justify-center h-14 px-10 rounded-full border border-gray-200 font-bold hover:bg-white transition-all"
              >
                Switch to Audio
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-[40px] transform -rotate-3 scale-105" />
            <div className="relative bg-white p-6 sm:p-12 rounded-[40px] shadow-xl border border-gray-100">
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
            href="/media"
            className="inline-flex items-center gap-2 text-primary font-bold group"
          >
            View Full Archive
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {archives.map((sermon) => (
            <MediaCard key={sermon.id} media={sermon} />
          ))}
        </div>
      </SectionContainer>
    </main>
  );
}
