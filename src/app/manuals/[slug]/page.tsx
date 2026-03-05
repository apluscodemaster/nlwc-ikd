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

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

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
      title: "Manual Not Found | NLWC Ikorodu",
    };
  }

  return {
    title: `${manual.title} | Sunday School | NLWC Ikorodu`,
    description:
      manual.excerpt || `Read the Sunday School manual: ${manual.title}`,
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

  return (
    <main className="min-h-screen bg-gray-50">
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
            <Link
              href="/manuals"
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Manuals
            </Link>

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
      <SectionContainer className="py-8 sm:py-12">
        <article className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 md:p-12 overflow-hidden">
          <TranscriptContent
            content={manual.content}
            accentColor="amber"
            searchQuery={searchQuery}
          />
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
            <Link
              href="/manuals"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
              <BookMarked className="w-4 h-4" />
              All Manuals
            </Link>
          </div>
        </div>
      </SectionContainer>
    </main>
  );
}
