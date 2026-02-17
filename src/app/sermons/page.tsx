import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import SermonsPageContent from "@/components/media/SermonsPageContent";

export const metadata: Metadata = {
  title: "Sermons & Audio Messages | NLWC Ikorodu",
  description:
    "Read message transcripts and listen to powerful audio sermons from New and Living Way Church, Ikorodu.",
};

export default function SermonsPage() {
  return (
    <main>
      <PageHeader
        title="Sermons & Messages"
        subtitle="Read transcripts and listen to powerful audio messages that will transform your life and deepen your faith."
      />

      <SectionContainer>
        <SermonsPageContent />
      </SectionContainer>
    </main>
  );
}
