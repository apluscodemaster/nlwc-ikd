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
      />

      <SectionContainer>
        <ManualsList perPage={9} />
      </SectionContainer>
    </main>
  );
}
