import type { Metadata } from "next";
import dynamic from "next/dynamic";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import Hero from "@/components/landing/Hero";
import WelcomeSection from "@/components/landing/WelcomeSection";
import GodWantsYou from "@/components/landing/GodWantsYou";
import OurJourney from "@/components/landing/OurJourney";
import ServiceTimes from "@/components/landing/ServiceTimes";
import { GATHERINGS_QUERY_KEY, toGatherings } from "@/lib/gatherings";
import { getPublicSchedule } from "@/lib/publicSchedule.server";

// Below the fold: still server-rendered, but their JavaScript (YouTube player,
// gallery carousel) loads as separate chunks instead of in the page bundle.
const MediaHub = dynamic(() => import("@/components/landing/MediaHub"));
const GalleryPreview = dynamic(
  () => import("@/components/landing/GalleryPreview"),
);

// The canonical URL lives here, not in the root layout: every page inherits
// the layout's metadata, so one there told Google that any page without its
// own canonical was a copy of the home page.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Rebuilt at most every 5 minutes, and straight away when an admin changes
// the schedule (its cache tag is expired on every write).
export const revalidate = 300;

/**
 * Server component: the sections are client components, but the schedule
 * data is fetched here so the Weekly Meetings cards are in the first HTML
 * instead of appearing after the page loads and calls /api/schedule.
 */
export default async function HomePage() {
  const queryClient = new QueryClient();
  try {
    const schedule = await getPublicSchedule();
    queryClient.setQueryData(GATHERINGS_QUERY_KEY, toGatherings(schedule));
  } catch (err) {
    // Firestore unreachable (e.g. at build time): the section fetches it in
    // the browser instead, as before.
    console.warn("[home] schedule prefetch skipped:", err);
  }

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

        {/* 4. Weekly Meetings */}
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ServiceTimes />
        </HydrationBoundary>

        {/* 5. Spiritual Nourishment (Audio, Video, Transcripts, Manuals) */}
        <MediaHub />

        {/* 6. Gallery Preview */}
        <GalleryPreview />
      </main>
    </div>
  );
}
