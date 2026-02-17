import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import VideoMessagesContent from "@/components/media/VideoMessagesContent";

export const metadata: Metadata = {
  title: "Video Messages | NLWC Ikorodu",
  description:
    "Watch life-changing video messages and teachings from New and Living Way Church, Ikorodu.",
};

export default function VideoMessagesPage() {
  return (
    <main>
      <PageHeader
        title="Video Messages"
        subtitle="Watch and be inspired by our latest video teachings. Access our library of spiritual nourishment from anywhere in the world."
      />

      <SectionContainer className="py-12 sm:py-20">
        <VideoMessagesContent />
      </SectionContainer>
    </main>
  );
}
