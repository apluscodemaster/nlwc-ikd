"use client";

import React from "react";
import Hero from "@/components/landing/Hero";
import GodWantsYou from "@/components/landing/GodWantsYou";
import OurJourney from "@/components/landing/OurJourney";
import LeadershipGrid from "@/components/about/LeadershipGrid";
import ServiceTimes from "@/components/landing/ServiceTimes";
import MediaHub from "@/components/landing/MediaHub";
import GalleryPreview from "@/components/landing/GalleryPreview";
import DevotionalPrompt from "@/components/devotionals/DevotionalPrompt";
import WelcomeSection from "@/components/landing/WelcomeSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* 1. Hero Section */}
        <Hero />

        <WelcomeSection />

        {/* 2. God Wants You — Headline + CTA */}
        <GodWantsYou />

        {/* 3. Our Journey — Faith, Hope, Charity */}
        <OurJourney />

        {/* 4. Meet Our Pastors */}
        <LeadershipGrid />

        {/* 5. Weekly Meetings */}
        <ServiceTimes />

        {/* 6. Spiritual Nourishment (Audio, Video, Transcripts, Manuals) */}
        <MediaHub />

        {/* 7. Gallery Preview */}
        <GalleryPreview />
      </main>

      {/* Daily Devotional Invitation */}
      <DevotionalPrompt />
    </div>
  );
}
