import { Metadata } from "next";
import { getDevotionalById } from "@/lib/devotionals";
import { SITE_URL, OG_IMAGE, stripHtml, metaDescription } from "@/utils/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let devotional = null;
  try {
    devotional = await getDevotionalById(id);
  } catch {
    // Firestore unavailable — fall back to generic metadata below.
  }

  if (!devotional) {
    return {
      title: "Daily Devotional",
      description:
        "Read today's daily devotional from The New & Living Way Church, Ikorodu.",
    };
  }

  const title = stripHtml(devotional.title);
  const description = metaDescription(
    `${title} — a daily devotional from The New & Living Way Church, Ikorodu.`,
  );
  const url = `${SITE_URL}/devotionals/${id}`;
  const publishedTime = devotional.scheduledDate?.toDate
    ? devotional.scheduledDate.toDate().toISOString()
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime,
      images: [{ url: OG_IMAGE, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default function DevotionalViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
