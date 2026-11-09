import type { ReactElement } from "react";
import { ActivityIndicator, FlatList, RefreshControl, type ListRenderItem } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { EmptyState, ErrorState, ListSkeleton } from "~/components";
import { spacing, useTheme } from "~/theme";

interface Props<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  header?: ReactElement;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isRefetching: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyMessage?: string;
}

/** FlatList wired for an infinite React Query: skeleton, error, empty, paging, pull to refresh. */
export function InfiniteList<T>(p: Props<T>) {
  const { colors } = useTheme();
  return (
    <FlatList
      data={p.items}
      keyExtractor={p.keyExtractor}
      renderItem={p.renderItem}
      ListHeaderComponent={p.header}
      ListEmptyComponent={
        p.isLoading ? (
          <ListSkeleton />
        ) : p.isError ? (
          <ErrorState error={p.error} onRetry={() => p.refetch()} />
        ) : (
          <EmptyState icon={p.emptyIcon} title={p.emptyTitle} message={p.emptyMessage} />
        )
      }
      ListFooterComponent={
        p.isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary} /> : null
      }
      onEndReached={() => {
        if (p.hasNextPage && !p.isFetchingNextPage) p.fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl
          refreshing={p.isRefetching && !p.isFetchingNextPage}
          onRefresh={() => p.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: spacing.huge }}
    />
  );
}
