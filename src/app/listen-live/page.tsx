"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import AudioLivePlayer from "@/components/live/AudioLivePlayer";
import ServiceCountdown from "@/components/live/ServiceCountdown";
import { recentSermons } from "@/data/sermons";
import MediaCard from "@/components/media/MediaCard";
import { ArrowRight, Headset, Calendar, Share2 } from "lucide-react";
import Link from "next/link";

export default function ListenLivePage() {
  const archives = recentSermons.filter((s) => s.type === "audio").slice(0, 3);

  return (
    <main>
      <PageHeader
        title="Listen Live"
        subtitle="Join our audio broadcast and immerse yourself in the Word. Perfect for slow connections or listening on the go."
        backgroundImage="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer className="pb-10">
        <AudioLivePlayer />
      </SectionContainer>

      <SectionContainer className="bg-gray-50 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
                — AUDIO EXPERIENCE
              </h4>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                Listen Anywhere, <br className="hidden sm:block" />
                <span className="text-primary">Anytime</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Can&apos;t watch the video? Our audio stream is optimized for
                all mobile devices and low-bandwidth environments, ensuring you
                never miss a moment of the service.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <Headset className="w-5 h-5" />,
                  title: "Crystal Clear",
                  desc: "High-quality audio streaming",
                },
                {
                  icon: <Calendar className="w-5 h-5" />,
                  title: "Weekly Schedule",
                  desc: "Sundays & Mid-week services",
                },
                {
                  icon: <Share2 className="w-5 h-5" />,
                  title: "Share Stream",
                  desc: "Invite others to listen along",
                },
                {
                  icon: <Calendar className="w-5 h-5" />,
                  title: "Reminders",
                  desc: "Get notified before we start",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-5 rounded-3xl bg-white border border-gray-100 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-[40px] transform rotate-3 scale-105" />
            <div className="relative bg-white p-8 sm:p-12 rounded-[40px] shadow-xl border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  Next Service In:
                </h3>
              </div>
              <ServiceCountdown />
            </div>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm">
              — RECENT AUDIO
            </h4>
            <h2 className="text-3xl font-bold text-gray-900">Audio Archives</h2>
          </div>
          <Link
            href="/media?type=audio"
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
