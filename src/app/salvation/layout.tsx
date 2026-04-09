import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Become Born-Again Today",
  description:
    "Receive Jesus Christ into your heart and begin your eternal journey with God. Pray the prayer of salvation and become born-again today with NLWC Ikorodu.",
  keywords: [
    "salvation prayer",
    "born again",
    "accept Jesus",
    "become a Christian",
    "prayer of salvation Nigeria",
    "Holy Ghost baptism",
  ],
  openGraph: {
    title: "Become Born-Again Today | NLWC Ikorodu",
    description:
      "Receive Jesus into your heart and begin your eternal journey with God. Pray the prayer of salvation today.",
    url: "https://ikorodu.nlwc.church/salvation",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/salvation" },
};

export default function SalvationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
