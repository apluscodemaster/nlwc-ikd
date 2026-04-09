import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Listen Live — Audio Broadcast",
  description:
    "Listen to The New & Living Way Church, Ikorodu live on audio. Perfect for low-bandwidth connections and listening on the go. Join Sunday and midweek services.",
  keywords: [
    "NLWC audio stream",
    "listen church online Lagos",
    "church radio Ikorodu",
    "NLWC Ikorodu audio",
  ],
  openGraph: {
    title: "Listen Live | NLWC Ikorodu",
    description:
      "Join our audio broadcast and immerse yourself in the Word. Perfect for slow connections or listening on the go.",
    url: "https://ikorodu.nlwc.church/listen-live",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/listen-live" },
};

export default function ListenLiveLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
