"use client";

import React from "react";
import Hero from "@/components/landing/Hero";
import WelcomeSection from "@/components/landing/WelcomeSection";
import ServiceTimes from "@/components/landing/ServiceTimes";
import MediaHub from "@/components/landing/MediaHub";
import UpcomingEvents from "@/components/landing/UpcomingEvents";
import GalleryPreview from "@/components/landing/GalleryPreview";
import CTASection from "@/components/landing/CTASection";
import DevotionalPrompt from "@/components/devotionals/DevotionalPrompt";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <Hero />

        {/* Welcome Section */}
        <WelcomeSection />

        {/* Service Times */}
        <ServiceTimes />

        {/* Media Hub (Audio, Video, Transcripts, Manuals) */}
        <MediaHub />

        {/* Upcoming Events */}
        <UpcomingEvents />

        {/* Gallery Preview */}
        <GalleryPreview />

        {/* Call to Action */}
        <CTASection />
      </main>

      {/* Daily Devotional Invitation */}
      <DevotionalPrompt />
    </div>
  );
}
