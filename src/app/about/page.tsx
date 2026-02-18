"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import StorySection from "@/components/about/StorySection";
import LeadershipGrid from "@/components/about/LeadershipGrid";
import BeliefsAccordion from "@/components/about/BeliefsAccordion";
import MeetingsGrid from "@/components/about/MeetingsGrid";
import CTASection from "@/components/landing/CTASection";

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        title="Our Story & Mission"
        subtitle="Discover who we are, what we believe, and the heart behind everything we do at The New & Living Way Church."
        backgroundImage="https://images.unsplash.com/photo-1510936111840-65e151ad71bb?q=80&w=2090&auto=format&fit=crop"
      />

      <StorySection />

      <LeadershipGrid />

      <BeliefsAccordion />

      <MeetingsGrid />

      <CTASection />
    </main>
  );
}
