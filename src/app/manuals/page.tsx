import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import ManualsList from "@/components/media/ManualsList";

export const metadata: Metadata = {
  title: "Sunday School Manuals | NLWC Ikorodu",
  description:
    "Access Sunday School study materials and teaching resources from New and Living Way Church, Ikorodu.",
};

export default function ManualsPage() {
  return (
    <main>
      <PageHeader
        title="Sunday School Manuals"
        subtitle="Access study materials and teaching resources for our Sunday School sessions."
        backgroundImage="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop"
      />

      <SectionContainer>
        <ManualsList perPage={9} />
      </SectionContainer>
    </main>
  );
}
