import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronDown, Headphones } from "~/components/icons";
import { Chip, EmptyState, ErrorState, ListSkeleton, SearchField, Text } from "~/components";
import { useSermonFilters, useSermonList } from "~/hooks/useSermons";
import type { AudioSermon } from "~/shared";
import { spacing, useTheme } from "~/theme";
import { usePlaySermon } from "./playSermon";
import { SermonFilterSheet, type SermonFilters } from "./SermonFilterSheet";
import { SermonRow } from "./SermonRow";

type SheetKind = "series" | "speaker" | "year";

/** Audio messages list: search, filters, infinite scroll (port of AudioSermonsList). */
export function AudioMessages({ header, initialSearch }: { header?: React.ReactElement; initialSearch?: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [search, setSearch] = useState(initialSearch ?? "");
  const [filters, setFilters] = useState<SermonFilters>({});
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const { series, speakers } = useSermonFilters();
  const { playSermon, loadingId } = usePlaySermon();

  const query = useSermonList({ search: search || undefined, ...filters });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);
  const total = query.data?.pages[0]?.pagination.total;

  const open = useCallback((s: AudioSermon) => router.push(`/sermons/${s.id}`), [router]);
  // The visible list becomes the play queue, so the next message follows on.
  const playFromList = useCallback((s: AudioSermon) => void playSermon(s, items), [playSermon, items]);

  const label = (kind: SheetKind): string => {
    if (kind === "series") return series.find((s) => s.id === filters.seriesId)?.title ?? "Series";
    if (kind === "speaker") return speakers.find((s) => s.id === filters.speakerId)?.name ?? "Speaker";
    return filters.year ? String(filters.year) : "Year";
  };
  const active = (kind: SheetKind) =>
    kind === "series" ? !!filters.seriesId : kind === "speaker" ? !!filters.speakerId : !!filters.year;

  const listHeader = (
    <View style={styles.header}>
      {header}
      <SearchField value={search} onChangeDebounced={setSearch} placeholder="Search messages, speakers…" />
      <View style={styles.chips}>
        {(["series", "speaker", "year"] as const).map((k) => (
          <Chip key={k} fill label={label(k)} selected={active(k)} icon={ChevronDown} onPress={() => setSheet(k)} />
        ))}
      </View>
      {total != null ? (
        <Text variant="small" color="textMuted">
          {total} message{total === 1 ? "" : "s"}
        </Text>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(s) => String(s.id)}
        renderItem={({ item }) => (
          <SermonRow sermon={item} onOpen={open} onPlay={playFromList} loading={loadingId === item.id} />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          query.isLoading ? (
            <ListSkeleton />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState
              icon={Headphones}
              title="No messages found"
              message="Try a different search or clear the filters."
              actionLabel={search || Object.values(filters).some(Boolean) ? "Clear all" : undefined}
              onAction={() => {
                setSearch("");
                setFilters({});
              }}
            />
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : undefined
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: spacing.huge }}
      />
      <SermonFilterSheet kind={sheet} value={filters} onChange={setFilters} onClose={() => setSheet(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.gutter, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.xs },
  // Three filters share the full width equally.
  chips: { flexDirection: "row", gap: spacing.xs },
  footer: { marginVertical: spacing.lg },
});
