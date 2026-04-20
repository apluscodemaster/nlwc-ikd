import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Watch Live — Video Broadcast",
  description:
    "Watch The New & Living Way Church, Ikorodu live online. Join our Sunday services, midweek Bible studies, and special programs via live video stream.",
  keywords: [
    "NLWC live stream",
    "church live service Ikorodu",
    "watch church online Lagos",
    "NLWC Ikorodu YouTube",
  ],
  openGraph: {
    title: "Watch Live | NLWC Ikorodu",
    description:
      "Experience the glory in high definition. Watch our live services and special events from anywhere in the world.",
    url: "https://ikorodu.nlwc.church/live",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/live" },
};

export default function LiveLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
