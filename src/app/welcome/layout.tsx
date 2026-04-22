import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "First Timer — Welcome",
  description:
    "Are you visiting NLWC Ikorodu for the first time? Fill out our first-timer form and our welcome team will personally reach out to make you feel at home.",
  openGraph: {
    title: "First Timer | Welcome to NLWC Ikorodu",
    description:
      "First time at NLWC Ikorodu? We'd love to connect with you. Fill out our welcome form and our team will reach out to you.",
    url: "https://ikorodu.nlwc.church/welcome",
  },
  robots: { index: false, follow: false }, // This is a form page — not ideal for indexing
  alternates: { canonical: "https://ikorodu.nlwc.church/welcome" },
};

export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
