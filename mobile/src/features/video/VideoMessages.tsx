import { useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Video } from "lucide-react-native";
import { youtubeThumb } from "~/api/video";
import { ChipRow, EmptyState, ErrorState, ListRow, ListSkeleton, SearchField } from "~/components";
import { useVideoMessages } from "~/hooks/useVideo";
import { videoSlug } from "~/shared";
import { spacing, useTheme } from "~/theme";

const ALL = "__all__";

/** Video messages list (port of VideoMessagesContent): search + service category. */
export function VideoMessages() {
  const router = useRouter();
  const { colors } = useTheme();
  const query = useVideoMessages();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(() => {
    const set = new Set((query.data ?? []).map((v) => v.serviceCategory?.trim()).filter(Boolean) as string[]);
    return [{ value: ALL, label: "All" }, ...[...set].sort().map((c) => ({ value: c, label: c }))];
  }, [query.data]);

  const items = useMemo(() => {
    const needle = search.toLowerCase();
    return (query.data ?? []).filter(
      (v) =>
        (category === ALL || v.serviceCategory?.trim() === category) &&
        (!needle || `${v.title ?? ""} ${v.minister ?? ""} ${v.serviceCategory ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [query.data, search, category]);

  return (
    <FlatList
      data={items}
      keyExtractor={(v) => `${v.id}-${v.date}`}
      renderItem={({ item }) => (
        <ListRow
          title={item.title || "Untitled message"}
          subtitle={item.minister}
          meta={[item.date, item.serviceCategory].filter(Boolean).join(" · ")}
          thumbnail={youtubeThumb(item.id, "mq")}
          onPress={() => router.push(`/video-messages/${encodeURIComponent(videoSlug(item))}`)}
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <SearchField value={search} onChangeDebounced={setSearch} placeholder="Search videos, ministers…" />
          {categories.length > 2 ? <ChipRow options={categories} value={category} onChange={setCategory} /> : null}
        </View>
      }
      ListEmptyComponent={
        query.isLoading ? (
          <ListSkeleton />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : (
          <EmptyState icon={Video} title="No videos found" message="Try a different search or category." />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: spacing.huge }}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.gutter, paddingTop: spacing.sm, gap: spacing.xs },
});
