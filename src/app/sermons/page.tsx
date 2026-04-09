import { Suspense } from "react";
import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import SermonsPageContent from "@/components/media/SermonsPageContent";

export const metadata: Metadata = {
  title: "Audio Messages",
  description:
    "Listen to life-changing messages from New and Living Way Church, Ikorodu. Search by speaker, category, or topic to find exactly what you need for your spiritual growth.",
  keywords: [
    "NLWC sermons",
    "audio messages Ikorodu",
    "church messages Lagos",
    "Christian sermons Nigeria",
    "Bible teaching Lagos",
  ],
  openGraph: {
    title: "Audio Messages | NLWC Ikorodu",
    description:
      "Listen to life-changing messages from NLWC Ikorodu. Search by speaker, topic, or category.",
    url: "https://ikorodu.nlwc.church/sermons",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/sermons" },
};

export default function SermonsPage() {
  return (
    <main>
      <PageHeader
        title="Audio Messages"
        subtitle="Listen and Listen Again! Play and download spiritually edifying messages. Search by speaker, category, or topic to find the message you need."
        backgroundImage="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer>
        <Suspense fallback={null}>
          <SermonsPageContent />
        </Suspense>
      </SectionContainer>
    </main>
  );
}
