"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/landing/Hero";
import WelcomeSection from "@/components/landing/WelcomeSection";
import ServiceTimes from "@/components/landing/ServiceTimes";
import RecentSermons from "@/components/landing/RecentSermons";
import UpcomingEvents from "@/components/landing/UpcomingEvents";
import GalleryPreview from "@/components/landing/GalleryPreview";
import CTASection from "@/components/landing/CTASection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <Hero />

        {/* Welcome Section */}
        <WelcomeSection />

        {/* Service Times */}
        <ServiceTimes />

        {/* Recent Sermons */}
        <RecentSermons />

        {/* Upcoming Events */}
        <UpcomingEvents />

        {/* Gallery Preview */}
        <GalleryPreview />

        {/* Call to Action */}
        <CTASection />
      </main>
    </div>
  );
}
