import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "House Fellowship Centers",
  description:
    "Find a house fellowship center near you in Ikorodu, Lagos. NLWC house fellowships are places of deep community, prayer, and spiritual growth.",
  keywords: [
    "house fellowship Ikorodu",
    "fellowship center Lagos",
    "NLWC fellowship",
    "Christian small group Lagos",
  ],
  openGraph: {
    title: "House Fellowship Centers | NLWC Ikorodu",
    description:
      "Connect with a family of believers near you. Find NLWC house fellowship centers across Ikorodu, Lagos.",
    url: "https://ikorodu.nlwc.church/fellowship",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/fellowship" },
};

export default function FellowshipLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
