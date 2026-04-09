import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import VideoMessagesContent from "@/components/media/VideoMessagesContent";

export const metadata: Metadata = {
  title: "Video Messages",
  description:
    "Watch life-changing video messages and teachings from New and Living Way Church, Ikorodu. Browse by speaker, topic, or service category.",
  openGraph: {
    title: "Video Messages | NLWC Ikorodu",
    description:
      "Watch teachings and sermons from NLWC Ikorodu. Browse by speaker or topic.",
    url: "https://ikorodu.nlwc.church/video-messages",
  },
  alternates: { canonical: "https://ikorodu.nlwc.church/video-messages" },
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
