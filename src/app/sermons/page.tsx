import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import SermonsPageContent from "@/components/media/SermonsPageContent";

export const metadata: Metadata = {
  title: "Sermons & Audio Messages | NLWC Ikorodu",
  description:
    "Listen to life-changing messages from New and Living Way Church, Ikorodu.",
};

export default function SermonsPage() {
  return (
    <main>
      <PageHeader
        title="Audio Messages"
        subtitle="Listen to a life-changing teachings. Search by speaker, category, or topic to find the message you need."
        backgroundImage="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=2070&auto=format&fit=crop"
      />

      <SectionContainer>
        <SermonsPageContent />
      </SectionContainer>
    </main>
  );
}
