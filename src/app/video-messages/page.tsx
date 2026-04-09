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
        subtitle="Watch the Video Format of all our teachings. Search by speaker, category, or topic to find the message you need."
        backgroundImage="https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247833/nlwc-ikd-assets/ygkueoffnv3wvqy4d7ir.avif"
      />

      <SectionContainer className="py-12 sm:py-20">
        <VideoMessagesContent />
      </SectionContainer>
    </main>
  );
}
