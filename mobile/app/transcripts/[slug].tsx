import { Stack, useLocalSearchParams } from "expo-router";
import { ErrorState, LoadingState } from "~/components";
import { ReaderLayout } from "~/features/reader/ReaderLayout";
import { useTranscript } from "~/hooks/useReader";
import { SITE_URL } from "~/lib/config";

/** Transcript reader (web /transcripts/[slug]). `q` highlights the search that led here. */
export default function TranscriptScreen() {
  const { slug, q } = useLocalSearchParams<{ slug: string; q?: string }>();
  const query = useTranscript(slug);
  const t = query.data;

  if (query.isLoading)
    return (
      <>
        <Stack.Screen options={{ title: "Transcript" }} />
        <LoadingState />
      </>
    );
  if (query.isError || !t)
    return (
      <>
        <Stack.Screen options={{ title: "Transcript" }} />
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </>
    );

  return (
    <ReaderLayout
      screenTitle="Transcript"
      overline={t.categories?.[0]}
      title={t.title}
      meta={[t.speaker, t.formattedDate, `${t.readingTime} min read`].filter(Boolean).join(" · ")}
      html={t.content}
      query={q}
      shareText={`${t.title}\n${SITE_URL}/transcripts/${t.slug}`}
    />
  );
}
