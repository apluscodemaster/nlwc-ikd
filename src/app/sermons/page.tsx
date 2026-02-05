import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import SermonsList from "@/components/media/SermonsList";

export const metadata: Metadata = {
  title: "Sermons | NLWC Ikorodu",
  description:
    "Watch and listen to powerful sermons and messages from New and Living Way Church, Ikorodu.",
};

export default function SermonsPage() {
  return (
    <main>
      <PageHeader
        title="Sermons"
        subtitle="Watch and listen to powerful messages that will transform your life and deepen your faith."
      />

      <SectionContainer>
        <SermonsList />
      </SectionContainer>
    </main>
  );
}
