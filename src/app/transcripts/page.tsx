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
      />

      <SectionContainer>
        <TranscriptsList perPage={9} />
      </SectionContainer>
    </main>
  );
}
