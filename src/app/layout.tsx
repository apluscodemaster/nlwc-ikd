import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import WhatsAppButtonWrapper from "@/components/WhatsAppButtonWrapper";
import FellowshipPrompt from "@/components/shared/FellowshipPrompt";
import RefTaggerReloader from "@/components/shared/RefTaggerReloader";
import CustomDialog from "@/components/shared/CustomDialog";
import { Jost } from "next/font/google";
import Providers from "@/components/Providers";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
import { OfflineDetector } from "@/components/OfflineDetector";
import GoogleTranslate from "@/components/GoogleTranslate";

const jost = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

const SITE_URL = "https://ikorodu.nlwc.church";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The New & Living Way Church | Ikorodu, Lagos",
    template: "%s | NLWC Ikorodu",
  },
  description:
    "Welcome to The New & Living Way Church — a community of faith, hope, and love in Ikorodu, Lagos, Nigeria. Join us for life-transforming worship, Bible study, and fellowship.",
  keywords: [
    "NLWC Ikorodu",
    "New and Living Way Church",
    "church in Ikorodu",
    "church in Lagos",
    "Word of Righteousness",
    "Christian church Ikorodu",
    "live church service Nigeria",
    "Bible study Ikorodu",
    "house fellowship Lagos",
  ],
  authors: [{ name: "NLWC Ikorodu", url: SITE_URL }],
  creator: "NLWC Ikorodu",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: SITE_URL,
    siteName: "The New & Living Way Church, Ikorodu",
    title: "The New & Living Way Church | Ikorodu, Lagos",
    description:
      "A Word of Righteousness community in Ikorodu, Lagos. Join us for worship, sermons, daily devotionals, and live services online.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "The New & Living Way Church, Ikorodu — Watch Live, Listen, and Grow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nlwcikorodu",
    title: "The New & Living Way Church | Ikorodu, Lagos",
    description:
      "A Word of Righteousness community in Ikorodu, Lagos. Join us for worship, sermons, daily devotionals, and live services online.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/nlwcikd-logo-512x512.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const churchSchemaData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": SITE_URL,
    name: "The New & Living Way Church",
    alternateName: "NLWC Ikorodu",
    description:
      "A Word of Righteousness community in Ikorodu, Lagos. Join us for worship, sermons, daily devotionals, and live services online.",
    url: SITE_URL,
    telephone: "+2348137436770",
    email: "ikoroduchurchadmin@nlwc.church",
    address: {
      "@type": "PostalAddress",
      streetAddress: "15, Alhaji Jimoh Olosugbo Close, Off Kokoro Abu Street",
      addressLocality: "Ikorodu",
      addressRegion: "Lagos",
      postalCode: "234",
      addressCountry: "NG",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "08:00",
        closes: "15:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Wednesday",
        opens: "18:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Friday",
        opens: "18:00",
        closes: "22:00",
      },
    ],
    image: OG_IMAGE,
    sameAs: [
      "https://www.facebook.com/nlwcikorodu",
      "https://www.youtube.com/@nlwcikorodu",
      "https://www.instagram.com/nlwcikorodu",
      "https://www.whatsapp.com",
    ],
    foundingDate: "2016",
    founder: {
      "@type": "Organization",
      name: "NLWC Leadership",
    },
  };

  return (
    <html lang="en" className={jost.variable} suppressHydrationWarning={true}>
      <head>
        {/* Schema.org JSON-LD for Local Business & Church */}
        <Script
          id="church-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(churchSchemaData),
          }}
        />
      </head>
      {/* Google tag (gtag.js) - deferred to lazyOnload for better page performance */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-1LPF0GLP9V"
        strategy="lazyOnload"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1LPF0GLP9V');`,
        }}
      />
      <body
        className="bg-gray-50 text-gray-900 font-sans overflow-x-hidden min-h-screen flex flex-col"
        suppressHydrationWarning={true}
      >
        <ServiceWorkerProvider>
          <OfflineDetector>
            <Providers>
              {/* Skip to Content Link - Accessibility */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-full focus:font-bold focus:shadow-lg"
              >
                Skip to main content
              </a>
              <Navbar />
              <main id="main-content" className="flex-grow pt-16">
                {children}
              </main>
              <ScrollToTop />
              <WhatsAppButtonWrapper />
              <GoogleTranslate />
              <FellowshipPrompt />
              <RefTaggerReloader />
              <CustomDialog />
            </Providers>
          </OfflineDetector>
        </ServiceWorkerProvider>
        <Footer />

        {/* Logos RefTagger — auto-detects Bible references and shows verse on hover */}
        <Script
          id="reftagger-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.refTagger = {
                settings: {
                  bibleVersion: "KJV",
                  tooltipStyle: "dark",
                  socialSharing: [],
                  tagChapters: true,
                  dropShadow: true,
                  noSearchTagNames: ["H1", "H2", "H3", "INPUT", "TEXTAREA"],
                  tagColor: "#FF7C18"
                }
              };
            `,
          }}
        />
        <Script
          src="https://api.reftagger.com/v2/RefTagger.js"
          strategy="lazyOnload"
        />

        {/* Note: Schema.org JSON-LD moved to head section to avoid duplication */}
      </body>
    </html>
  );
}
