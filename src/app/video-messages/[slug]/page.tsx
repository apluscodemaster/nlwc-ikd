import { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionContainer from "@/components/shared/SectionContainer";
import VideoMessagesContent from "@/components/media/VideoMessagesContent";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL, PUBLISHER, metaDescription, toIsoDate } from "@/utils/seo";
import { getVideoMessages, type VideoMessage } from "@/lib/videoMessages";
import { findVideoBySlug, videoSlug } from "@/lib/videoSlug";

// ISR: the sheet rarely changes; regenerate at most hourly.
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

/** Resolve a slug to a video, swallowing data-source errors. */
async function resolveVideo(slug: string): Promise<VideoMessage | undefined> {
  try {
    return findVideoBySlug(await getVideoMessages(), decodeURIComponent(slug));
  } catch {
    return undefined;
  }
}

function describe(video: VideoMessage): string {
  return metaDescription(
    [
      video.minister && `By ${video.minister}`,
      video.serviceCategory,
      video.date,
    ]
      .filter(Boolean)
      .join(" • ") ||
      `Watch "${video.title}" from The New & Living Way Church, Ikorodu.`,
  );
}

const PAGE_SUBTITLE =
  "Watch the Video Format of all our teachings. Search by speaker, category, or topic to find the message you need.";
const PAGE_HERO =
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247833/nlwc-ikd-assets/ygkueoffnv3wvqy4d7ir.avif";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await resolveVideo(slug);

  // Unknown slug — fall back to the listing's metadata (canonical to listing).
  if (!video) {
    return {
      title: "Video Messages",
      description:
        "Watch life-changing video messages and teachings from New and Living Way Church, Ikorodu.",
      alternates: { canonical: `${SITE_URL}/video-messages` },
    };
  }

  const title = video.title || "Video Message";
  const description = describe(video);
  const url = `${SITE_URL}/video-messages/${videoSlug(video)}`;
  const thumbnail = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;

  return {
    title,
    description,
    keywords: [
      title,
      "video message",
      "sermon",
      "NLWC Ikorodu",
      ...(video.minister ? [video.minister] : []),
      ...(video.serviceCategory ? [video.serviceCategory] : []),
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "video.other",
      url,
      images: [{ url: thumbnail, width: 1280, height: 720 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [thumbnail],
    },
  };
}

export default async function SharedVideoMessagePage({ params }: Props) {
  const { slug } = await params;
  const video = await resolveVideo(slug);

  const jsonLd = video
    ? [
        {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: video.title || "Video Message",
          description: describe(video),
          thumbnailUrl: [
            `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
          ],
          uploadDate: toIsoDate(video.date),
          embedUrl: `https://www.youtube.com/embed/${video.id}`,
          contentUrl: video.youtubeUrl,
          url: `${SITE_URL}/video-messages/${videoSlug(video)}`,
          inLanguage: "en",
          publisher: PUBLISHER,
          ...(video.minister
            ? { creator: { "@type": "Person", name: video.minister } }
            : {}),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            {
              "@type": "ListItem",
              position: 2,
              name: "Video Messages",
              item: `${SITE_URL}/video-messages`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: video.title || "Video Message",
              item: `${SITE_URL}/video-messages/${videoSlug(video)}`,
            },
          ],
        },
      ]
    : null;

  return (
    <main>
      {jsonLd && <JsonLd data={jsonLd} />}
      <PageHeader
        title="Video Messages"
        subtitle={PAGE_SUBTITLE}
        backgroundImage={PAGE_HERO}
      />

      <SectionContainer className="py-12 sm:py-20">
        <VideoMessagesContent openSlug={decodeURIComponent(slug)} />
      </SectionContainer>
    </main>
  );
}
