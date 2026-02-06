import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getManualBySlug, getSundaySchoolManuals } from "@/lib/wordpress";
import SectionContainer from "@/components/shared/SectionContainer";
import ShareButton from "@/components/shared/ShareButton";
import TranscriptContent from "@/components/shared/TranscriptContent";
import { Calendar, ArrowLeft, BookMarked } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
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
  // Pre-generate only first 5 pages to avoid rate limiting
  // Rest will be generated on-demand with ISR
  try {
    const { manuals } = await getSundaySchoolManuals({ perPage: 5 });
    return manuals.map((m) => ({ slug: m.slug }));
  } catch {
    // If API fails during build, generate pages on-demand
    return [];
  }
}

export default async function ManualPage({ params }: Props) {
  const { slug } = await params;
  const manual = await getManualBySlug(slug);

  if (!manual) {
    notFound();
  }
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <SectionContainer className="py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/manuals"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-600 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Manuals
            </Link>

            {/* Type Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <BookMarked className="w-3.5 h-3.5" />
                Sunday School Manual
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight"
              dangerouslySetInnerHTML={{ __html: manual.title }}
            />

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground bg-gray-50/50 p-4 rounded-2xl sm:bg-transparent sm:p-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                {manual.formattedDate}
              </div>
              <div className="w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex sm:block justify-end">
                <ShareButton title={manual.title} url={manual.link} />
              </div>
            </div>
          </div>
        </SectionContainer>
      </div>

      {/* Content */}
      <SectionContainer className="py-8 sm:py-12">
        <article className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 md:p-12 overflow-hidden">
          <TranscriptContent content={manual.content} accentColor="amber" />
        </article>
      </SectionContainer>

      {/* Related Navigation */}
      <SectionContainer className="pb-16 pt-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link
            href="/manuals"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            All Manuals
          </Link>
          <a
            href={manual.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition-all active:scale-95"
          >
            View on Website
          </a>
        </div>
      </SectionContainer>
    </main>
  );
}
