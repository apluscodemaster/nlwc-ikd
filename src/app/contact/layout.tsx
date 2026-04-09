import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with The New & Living Way Church, Ikorodu. Reach out to us via email, phone, or visit us in person. We're here to pray for you and answer your questions.",
  openGraph: {
    title: "Contact Us | NLWC Ikorodu",
    description:
      "Reach out to NLWC Ikorodu via email, WhatsApp, or visit us in person. We're here and happy to connect.",
    url: "https://ikorodu.nlwc.church/contact",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/contact" },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
