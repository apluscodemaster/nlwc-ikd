import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Gallery — Our Worship Experience",
  description:
    "Browse photos from church services, special gatherings, and events at The New & Living Way Church, Ikorodu. Relive powerful moments of worship and fellowship.",
  openGraph: {
    title: "Gallery | NLWC Ikorodu",
    description:
      "Relive moments from our church services, special events, and community gatherings at NLWC Ikorodu.",
    url: "https://ikorodu.nlwc.church/gallery",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/gallery" },
};

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
