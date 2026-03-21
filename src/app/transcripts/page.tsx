import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import TranscriptsList from "@/components/media/TranscriptsList";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Message Transcripts | NLWC Ikorodu",
  description:
    "Read the full transcripts of Sunday messages and teachings from New and Living Way Church, Ikorodu.",
};

export default function TranscriptsPage() {
  return (
    <main>
      <PageHeader
        title="Message Transcripts"
        subtitle="Read the Transcript of all our Teachings."
        backgroundImage="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer>
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-medium text-lg">
                Loading transcripts...
              </p>
            </div>
          }
        >
          <TranscriptsList perPage={9} />
        </Suspense>
      </SectionContainer>
    </main>
  );
}
