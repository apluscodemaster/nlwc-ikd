import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import TranscriptsList from "@/components/media/TranscriptsList";

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
        subtitle="Read the full written transcripts of our Sunday messages. Study the Word at your own pace."
        backgroundImage="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer>
        <TranscriptsList perPage={9} />
      </SectionContainer>
    </main>
  );
}
