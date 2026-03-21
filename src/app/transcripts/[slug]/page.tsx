import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getTranscriptBySlug,
  getSundayMessageTranscripts,
} from "@/lib/wordpress";
import SectionContainer from "@/components/shared/SectionContainer";
import ShareButton from "@/components/shared/ShareButton";
import TranscriptContent from "@/components/shared/TranscriptContent";
import SearchHighlightBanner from "@/components/shared/SearchHighlightBanner";
import { Calendar, User, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const transcript = await getTranscriptBySlug(slug);

  if (!transcript) {
    return {
      title: "Transcript Not Found | NLWC Ikorodu",
    };
  }

  return {
    title: `${transcript.title} | NLWC Ikorodu`,
    description:
      transcript.excerpt || `Read the transcript of ${transcript.title}`,
  };
}

export async function generateStaticParams() {
  // Pre-generate only first 5 pages to avoid rate limiting
  // Rest will be generated on-demand with ISR
  try {
    const { transcripts } = await getSundayMessageTranscripts({ perPage: 5 });
    return transcripts.map((t) => ({ slug: t.slug }));
  } catch {
    // If API fails during build, generate pages on-demand
    return [];
  }
}

export default async function TranscriptPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const transcript = await getTranscriptBySlug(slug);
  const searchQuery =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";

  if (!transcript) {
    notFound();
  }
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Search Highlight Banner */}
      {searchQuery && (
        <SearchHighlightBanner
          query={searchQuery}
          backHref="/transcripts"
          backLabel="transcripts"
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <SectionContainer className="py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/transcripts"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Transcripts
            </Link>

            {/* Type Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                  transcript.type === "sunday-school"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                {transcript.type === "sunday-school"
                  ? "Sunday School Manual"
                  : "Sunday Message"}
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight"
              dangerouslySetInnerHTML={{ __html: transcript.title }}
            />

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground bg-gray-50/50 p-4 rounded-2xl sm:bg-transparent sm:p-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {transcript.formattedDate}
              </div>
              {transcript.speaker && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  {transcript.speaker}
                </div>
              )}
              <div className="w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex sm:block justify-end">
                <ShareButton title={transcript.title} url={transcript.link} />
              </div>
            </div>
          </div>
        </SectionContainer>
      </div>

      {/* Content */}
      <SectionContainer className="py-8 sm:py-12">
        <article className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 md:p-12 overflow-hidden">
          <TranscriptContent
            content={transcript.content}
            searchQuery={searchQuery}
          />
        </article>
      </SectionContainer>

      {/* Related Navigation */}
      <SectionContainer className="pb-16 pt-0">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link
            href="/transcripts"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            All Transcripts
          </Link>
          {/* <a
            href={transcript.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            View on Website
          </a> */}
        </div>
      </SectionContainer>
    </main>
  );
}
