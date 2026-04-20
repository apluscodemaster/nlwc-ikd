import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Give — Honour God with Your Giving",
  description:
    "Support the work of God at The New & Living Way Church, Ikorodu through tithes, offerings, and the church building project. See bank transfer details here.",
  openGraph: {
    title: "Give | NLWC Ikorodu",
    description:
      "Honour God with your giving. Support the work of God at The New & Living Way Church, Ikorodu through tithes, offerings, and the church project.",
    url: "https://ikorodu.nlwc.church/give",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/give" },
};

export default function GiveLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
