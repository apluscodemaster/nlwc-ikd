import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { FileText } from "~/components/icons";
import { ChipRow, ListRow, SearchField } from "~/components";
import { useTranscriptCategories, useTranscriptList } from "~/hooks/useReader";
import { TRANSCRIPT_CATEGORIES } from "~/shared";
import { spacing } from "~/theme";
import { InfiniteList } from "./InfiniteList";

const BUILT_IN = Object.entries(TRANSCRIPT_CATEGORIES).map(([id, c]) => ({ id: Number(id), name: c.name }));

/** Message transcripts (port of TranscriptsList): search, category pills, infinite scroll. */
export function TranscriptList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(0);
  const { data: categories } = useTranscriptCategories();
  const q = useTranscriptList({ search: search || undefined, category: category || undefined });
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.data) ?? [], [q.data]);

  const options = useMemo(
    () => [
      { value: 0, label: "All" },
      ...(categories?.length ? categories : BUILT_IN).map((c) => ({
        value: c.id,
        label: c.name.replace(/\s*Transcripts?$/i, ""),
      })),
    ],
    [categories],
  );

  return (
    <InfiniteList
      items={items}
      keyExtractor={(t) => String(t.id)}
      renderItem={({ item }) => (
        <ListRow
          icon={FileText}
          thumbnail={item.thumbnail}
          title={item.title}
          subtitle={item.speaker}
          meta={[item.formattedDate, `${item.readingTime} min read`].filter(Boolean).join(" · ")}
          onPress={() =>
            router.push({ pathname: "/transcripts/[slug]", params: { slug: item.slug, ...(search ? { q: search } : {}) } })
          }
        />
      )}
      header={
        <View style={styles.header}>
          <SearchField value={search} onChangeDebounced={setSearch} placeholder="Search transcripts…" />
          <ChipRow options={options} value={category} onChange={setCategory} />
        </View>
      }
      isLoading={q.isLoading}
      isError={q.isError}
      error={q.error}
      isRefetching={q.isRefetching}
      hasNextPage={q.hasNextPage}
      isFetchingNextPage={q.isFetchingNextPage}
      fetchNextPage={q.fetchNextPage}
      refetch={q.refetch}
      emptyIcon={FileText}
      emptyTitle="No transcripts found"
      emptyMessage="Try a different search or category."
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.gutter, paddingTop: spacing.sm, gap: spacing.xs },
});
