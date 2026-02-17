import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import SermonsPageContent from "@/components/media/SermonsPageContent";

export const metadata: Metadata = {
  title: "Sermons & Audio Messages | NLWC Ikorodu",
  description:
    "Listen to powerful audio sermons and messages from New and Living Way Church, Ikorodu. Search by speaker, category, or topic.",
};

export default function SermonsPage() {
  return (
    <main>
      <PageHeader
        title="Audio Messages"
        subtitle="Listen to powerful sermons and teachings. Search by speaker, category, or topic to find the message you need."
      />

      <SectionContainer>
        <SermonsPageContent />
      </SectionContainer>
    </main>
  );
}
