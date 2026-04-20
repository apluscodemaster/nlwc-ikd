import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Our Story & Mission",
  description:
    "Learn about The New & Living Way Church in Ikorodu, Lagos — our history, leadership, core beliefs, and the heart behind everything we do.",
  openGraph: {
    title: "Our Story & Mission | NLWC Ikorodu",
    description:
      "Learn about The New & Living Way Church in Ikorodu — our history, leadership, and beliefs.",
    url: "https://ikorodu.nlwc.church/about",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/about" },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
