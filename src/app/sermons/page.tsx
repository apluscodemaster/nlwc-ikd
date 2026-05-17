import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";

// ISR: Revalidate every 10 minutes (matches cache duration)
export const revalidate = 600;
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

      {/* Quiz Banner */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" />
              Test Your Knowledge
            </h2>
            <p className="text-gray-600 mt-1">
              Take a quiz based on our recent audio messages.
            </p>
          </div>
          <Link
            href="/sermons/quiz"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-amber-500 text-white font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-105 transition-all w-full sm:w-auto justify-center whitespace-nowrap"
          >
            Start Quiz
          </Link>
        </div>
      </div>

      <SectionContainer>
        <Suspense fallback={null}>
          <SermonsPageContent />
        </Suspense>
      </SectionContainer>
    </main>
  );
}
