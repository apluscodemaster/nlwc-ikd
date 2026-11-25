import type { Metadata } from "next";
import { Abril_Fatface, Figtree, IBM_Plex_Mono } from "next/font/google";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/utils/seo";
import FestivalExperience from "./FestivalExperience";
import { FESTIVAL, VENUE_ONE_LINE } from "./eventInfo";

const display = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--fjr-display",
  display: "swap",
});
const body = Figtree({
  subsets: ["latin"],
  variable: "--fjr-body",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--fjr-mono",
  display: "swap",
});

const description = `${FESTIVAL.tagline}: ${FESTIVAL.dateLabel}, ${FESTIVAL.timeLabel} at ${FESTIVAL.venue.name}, ${FESTIVAL.venue.area}, Ikorodu. Attendance is free.`;

export const metadata: Metadata = {
  title: FESTIVAL.name,
  description,
  alternates: { canonical: FESTIVAL.path },
  openGraph: {
    type: "website",
    url: FESTIVAL.path,
    title: `${FESTIVAL.name} · 23 Dec, 5PM · Ikorodu`,
    description,
    images: [{ url: FESTIVAL.banner, alt: `${FESTIVAL.name} banner` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${FESTIVAL.name} · 23 Dec, 5PM · Ikorodu`,
    description,
    images: [FESTIVAL.banner],
  },
};

const eventLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: FESTIVAL.name,
  description,
  startDate: FESTIVAL.startsAt,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  isAccessibleForFree: true,
  image: [`${SITE_URL}${FESTIVAL.banner}`],
  url: `${SITE_URL}${FESTIVAL.path}`,
  location: {
    "@type": "Place",
    name: FESTIVAL.venue.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${FESTIVAL.venue.street}, ${FESTIVAL.venue.area}`,
      addressLocality: FESTIVAL.venue.city,
      addressRegion: FESTIVAL.venue.region,
      addressCountry: "NG",
    },
  },
  organizer: FESTIVAL.hosts.map((name) => ({ "@type": "Organization", name })),
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "NGN",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}${FESTIVAL.path}`,
  },
};

export default function FestivalPage() {
  return (
    // -mb-12 cancels the footer's top margin, so the dark page meets it.
    <div className={`${display.variable} ${body.variable} ${mono.variable} -mb-12`}>
      <JsonLd data={eventLd} />
      <FestivalExperience venueLine={VENUE_ONE_LINE} />
    </div>
  );
}
