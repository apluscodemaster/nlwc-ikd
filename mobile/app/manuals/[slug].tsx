import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ErrorState, LoadingState } from "~/components";
import { ReaderLayout } from "~/features/reader/ReaderLayout";
import { useManual, useManualAdjacent } from "~/hooks/useReader";
import { SITE_URL } from "~/lib/config";

/** Sunday School manual reader (web /manuals/[slug]) with previous/next lesson. */
export default function ManualScreen() {
  const { slug, q } = useLocalSearchParams<{ slug: string; q?: string }>();
  const router = useRouter();
  const query = useManual(slug);
  const m = query.data;
  const adjacent = useManualAdjacent(m?.date, m?.slug);

  if (query.isLoading)
    return (
      <>
        <Stack.Screen options={{ title: "Manual" }} />
        <LoadingState />
      </>
    );
  if (query.isError || !m)
    return (
      <>
        <Stack.Screen options={{ title: "Manual" }} />
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </>
    );

  const go = (s: string) => router.replace({ pathname: "/manuals/[slug]", params: { slug: s } });
  const prev = adjacent.data?.previous;
  const next = adjacent.data?.next;

  return (
    <ReaderLayout
      screenTitle="Sunday School"
      overline={m.theme}
      title={m.title}
      meta={[m.lesson, m.formattedDate, `${m.readingTime} min read`].filter(Boolean).join(" · ")}
      html={m.content}
      query={q}
      shareText={`${m.title}\n${SITE_URL}/manuals/${m.slug}`}
      previous={prev ? { title: prev.title, onPress: () => go(prev.slug) } : null}
      next={next ? { title: next.title, onPress: () => go(next.slug) } : null}
    />
  );
}
