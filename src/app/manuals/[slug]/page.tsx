import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getManualBySlug,
  getSundaySchoolManuals,
  getAdjacentManuals,
} from "@/lib/wordpress";
import SectionContainer from "@/components/shared/SectionContainer";
import ShareButton from "@/components/shared/ShareButton";
import TranscriptContent from "@/components/shared/TranscriptContent";
import SearchHighlightBanner from "@/components/shared/SearchHighlightBanner";
import ReadingProgressBar from "@/components/shared/ReadingProgressBar";
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Clock,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import BackToListLink from "@/components/shared/BackToListLink";
import JsonLd from "@/components/seo/JsonLd";
import {
  SITE_URL,
  OG_IMAGE,
  PUBLISHER,
  stripHtml,
  metaDescription,
  toIsoDate,
} from "@/utils/seo";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ISR: cache rendered pages for 5 minutes, then regenerate in background
export const revalidate = 300;

/**
 * Reading treatment for the manual body.
 *
 * Block-level selectors are DIRECT-child variants (`&>p`, `&>h2`, …) on
 * purpose: `formatMemoryTrack` injects its own pre-styled markup (memory track
 * cards, INTRODUCTION/CONCLUSION headers) as nested elements, so scoping to
 * direct children leaves those cards untouched and restyles only the raw
 * WordPress copy around them. List items, emphasis and images use descendant
 * variants because the injected markup contains none of them.
 */
const MANUAL_PROSE = [
  // Body copy stays justified (the shared default) — only size, leading and
  // rhythm change here.
  "[&>p]:text-[1.0625rem] sm:[&>p]:text-[1.125rem] [&>p]:leading-[1.9] [&>p]:text-gray-700 [&>p]:mb-6",
  // Drop cap opens the lesson. Only fires when the body actually starts with a
  // paragraph, so manuals that open with a heading or image are unaffected.
  "[&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mr-3",
  "[&>p:first-child]:first-letter:mt-1 [&>p:first-child]:first-letter:font-serif",
  "[&>p:first-child]:first-letter:text-[3.5rem] [&>p:first-child]:first-letter:font-black",
  "[&>p:first-child]:first-letter:leading-[0.78] [&>p:first-child]:first-letter:text-amber-600",
  // Headings get an accent rule so sections are scannable
  "[&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:border-l-4 [&>h2]:border-amber-500 [&>h2]:pl-4",
  "[&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-black [&>h2]:tracking-tight",
  "[&>h3]:mt-9 [&>h3]:mb-3 [&>h3]:text-base sm:[&>h3]:text-lg [&>h3]:font-bold",
  "[&>h3]:uppercase [&>h3]:tracking-wider [&>h3]:text-amber-700",
  // Quotes read as pull-quotes rather than indented copy
  "[&>blockquote]:my-8 [&>blockquote]:rounded-2xl [&>blockquote]:border-l-4",
  "[&>blockquote]:border-amber-500 [&>blockquote]:bg-amber-50/80 [&>blockquote]:px-6 [&>blockquote]:py-5",
  "[&>blockquote_p]:m-0 [&>blockquote_p]:text-lg [&>blockquote_p]:italic",
  "[&>blockquote_p]:leading-relaxed [&>blockquote_p]:text-amber-950",
  // Lists: amber markers, roomier lines
  "[&_li]:my-2 [&_li]:leading-[1.8] [&_li]:marker:font-bold [&_li]:marker:text-amber-500",
  // Ornamental section breaks
  "[&>hr]:my-12 [&>hr]:h-px [&>hr]:border-0 [&>hr]:bg-linear-to-r",
  "[&>hr]:from-transparent [&>hr]:via-amber-300 [&>hr]:to-transparent",
  // Figures. Deliberately nothing targeting <strong> or other inline elements:
  // scripture references are wrapped in-place by ScriptureProvider and often
  // sit inside bolded text, so this layer stays off inline content entirely.
  "[&_img]:rounded-2xl [&_img]:shadow-md",
].join(" ");

// Calculate read time from HTML content (~200 words per minute)
function calculateReadTime(htmlContent: string): number {
  const textContent = htmlContent
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = textContent.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const manual = await getManualBySlug(slug);

  if (!manual) {
    return {
      title: "Manual Not Found",
    };
  }

  const title = stripHtml(manual.title);
  const description = metaDescription(
    manual.excerpt || `Read the Sunday School manual "${title}" from NLWC Ikorodu.`,
  );
  const url = `${SITE_URL}/manuals/${slug}`;

  return {
    title: `${title} | Sunday School Manuals`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: manual.date,
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

export async function generateStaticParams() {
  try {
    const { manuals } = await getSundaySchoolManuals({ perPage: 5 });
    return manuals.map((m) => ({ slug: m.slug }));
  } catch {
    return [];
  }
}

export default async function ManualPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const manual = await getManualBySlug(slug);
  const searchQuery =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";

  if (!manual) {
    notFound();
  }

  const readTime = calculateReadTime(manual.content);

  // Fetch adjacent manuals for navigation
  const adjacent = await getAdjacentManuals(manual.date, manual.slug);

  const cleanTitle = stripHtml(manual.title);
  const pageUrl = `${SITE_URL}/manuals/${slug}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: cleanTitle,
    description: metaDescription(
      manual.excerpt || `Read the Sunday School manual "${cleanTitle}".`,
    ),
    datePublished: toIsoDate(manual.date),
    dateModified: toIsoDate(manual.date),
    inLanguage: "en",
    author: PUBLISHER,
    publisher: PUBLISHER,
    image: OG_IMAGE,
    articleSection: "Sunday School Manual",
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    url: pageUrl,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Sunday School Manuals",
        item: `${SITE_URL}/manuals`,
      },
      { "@type": "ListItem", position: 3, name: cleanTitle, item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <JsonLd data={[articleLd, breadcrumbLd]} />

      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      {/* Search Highlight Banner */}
      {searchQuery && (
        <SearchHighlightBanner
          query={searchQuery}
          backHref="/manuals"
          backLabel="manuals"
        />
      )}

      {/* ===== GRADIENT HERO HEADER ===== */}
      <div className="relative overflow-hidden bg-linear-to-br from-amber-600 via-orange-500 to-yellow-500">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/20" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/10" />
          <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-white/10" />
        </div>

        <SectionContainer className="py-10 md:py-16 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <BackToListLink
              fallbackHref="/manuals"
              storageKey="manuals"
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Manuals
            </BackToListLink>

            {/* Type Badge + Read Time */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <BookMarked className="w-3.5 h-3.5" />
                Sunday School Manual
              </div>
              <div className="bg-white/15 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                {readTime} min read
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-sm"
              dangerouslySetInnerHTML={{ __html: manual.title }}
            />

            {/* Meta Info Row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/60" />
                {manual.formattedDate}
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-white/60" />
                {readTime} minute{readTime > 1 ? "s" : ""} reading
              </div>
              <div className="ml-auto">
                <ShareButton
                  title={manual.title}
                  url={manual.link}
                  variant="light"
                />
              </div>
            </div>
          </div>
        </SectionContainer>
      </div>

      {/* ===== CONTENT ===== */}
      {/* Narrower than the hero on purpose: max-w-3xl keeps the line length in
          the comfortable 65–75 character range instead of running the full
          hero width. */}
      <SectionContainer className="py-8 sm:py-12">
        <article className="max-w-3xl mx-auto bg-white rounded-2xl sm:rounded-3xl ring-1 ring-amber-100/70 shadow-lg shadow-amber-900/5 overflow-hidden">
          {/* Accent edge ties the page back to the hero */}
          <div className="h-1.5 bg-linear-to-r from-amber-600 via-orange-500 to-yellow-400" />

          <div className="p-5 sm:p-8 md:p-12">
            <TranscriptContent
              content={manual.content}
              accentColor="amber"
              searchQuery={searchQuery}
              className={MANUAL_PROSE}
            />

            {/* End-of-lesson ornament — a clear finish line for the reader */}
            <div
              className="mt-12 flex items-center justify-center gap-3 text-amber-400"
              aria-hidden="true"
            >
              <span className="h-px w-12 bg-linear-to-r from-transparent to-amber-200" />
              <BookMarked className="w-4 h-4" />
              <span className="h-px w-12 bg-linear-to-l from-transparent to-amber-200" />
            </div>
          </div>
        </article>
      </SectionContainer>

      {/* ===== ADJACENT NAVIGATION ===== */}
      <SectionContainer className="pb-16 pt-0">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Previous Manual */}
            {adjacent.previous ? (
              <Link
                href={`/manuals/${adjacent.previous.slug}`}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-amber-600 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Previous
                  </p>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                    {adjacent.previous.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {/* Next Manual */}
            {adjacent.next ? (
              <Link
                href={`/manuals/${adjacent.next.slug}`}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all sm:flex-row-reverse sm:text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Next
                  </p>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                    {adjacent.next.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>

          {/* Back to All Manuals */}
          <div className="flex justify-center mt-8">
            <BackToListLink
              fallbackHref="/manuals"
              storageKey="manuals"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
              <BookMarked className="w-4 h-4" />
              All Manuals
            </BackToListLink>
          </div>
        </div>
      </SectionContainer>
    </main>
  );
}
