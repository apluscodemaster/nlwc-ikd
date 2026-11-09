import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Sun } from "~/components/icons";
import { EmptyState, ListRow } from "~/components";
import { useDevotionalArchive } from "~/hooks/useReader";
import { isFirebaseConfigured } from "~/lib/config";
import { formatLongDate } from "~/lib/dates";
import { InfiniteList } from "./InfiniteList";

/** Daily devotionals archive (port of DevotionalArchiveGrid). */
export function DevotionalList() {
  const router = useRouter();
  const q = useDevotionalArchive();
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);

  if (!isFirebaseConfigured) {
    return <EmptyState icon={Sun} title="Devotionals unavailable" message="This build isn't connected to the devotionals archive." />;
  }

  return (
    <InfiniteList
      items={items}
      keyExtractor={(d) => d.id}
      renderItem={({ item }) => (
        <ListRow
          icon={Sun}
          title={item.title}
          subtitle={formatLongDate(item.scheduledDate)}
          showChevron
          onPress={() => router.push(`/devotionals/${item.id}`)}
        />
      )}
      isLoading={q.isLoading}
      isError={q.isError}
      error={q.error}
      isRefetching={q.isRefetching}
      hasNextPage={q.hasNextPage}
      isFetchingNextPage={q.isFetchingNextPage}
      fetchNextPage={q.fetchNextPage}
      refetch={q.refetch}
      emptyIcon={Sun}
      emptyTitle="No devotionals yet"
    />
  );
}
