import "./globals.css";
import type { ReactNode } from "react";
import Script from "next/script";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import FellowshipPrompt from "@/components/shared/FellowshipPrompt";
import { Jost } from "next/font/google";
import Providers from "@/components/Providers";

const jost = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

export const metadata = {
  title: "The New & Living Way Church | Ikorodu, Lagos",
  description:
    "Welcome to The New & Living Way Church, a community of faith, hope, and love in Ikorodu, Lagos. Join us for a life-transforming experience.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jost.variable} suppressHydrationWarning={true}>
      {/* Google tag (gtag.js) */}
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-1LPF0GLP9V"
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
          <FellowshipPrompt />
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
