import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Media Resources — Sermons, Videos & More",
  description:
    "Access a rich library of sermon videos, audio messages, and spiritual study resources from The New & Living Way Church, Ikorodu. Grow your faith today.",
  openGraph: {
    title: "Media Resources | NLWC Ikorodu",
    description:
      "Grow in your faith with our collection of sermon videos, audio messages, and spiritual study resources from NLWC Ikorodu.",
    url: "https://ikorodu.nlwc.church/media",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/media" },
};

export default function MediaLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
