"use client";

import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import StorySection from "@/components/about/StorySection";
import LeadershipGrid from "@/components/about/LeadershipGrid";
import BeliefsAccordion from "@/components/about/BeliefsAccordion";
// import MeetingsGrid from "@/components/about/MeetingsGrid";
import CTASection from "@/components/landing/CTASection";
import UpcomingEvents from "@/components/landing/UpcomingEvents";

export default function AboutPage() {
  return (
    <main>
      <PageHeader
        title="Our Story & Mission"
        subtitle="Discover who we are, what we believe, and the heart behind everything we do at The New & Living Way Church."
        backgroundImage="/about-hero.jpg"
      />

      <StorySection />

      <LeadershipGrid />

      <BeliefsAccordion />

      {/* <MeetingsGrid /> */}

      <UpcomingEvents />

      <CTASection />
    </main>
  );
}
