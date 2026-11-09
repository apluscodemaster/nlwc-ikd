import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BookMarked, CalendarClock } from "~/components/icons";
import { ChipRow, ListRow, SearchField, StatusBadge } from "~/components";
import { useManualList, useManualThemes } from "~/hooks/useReader";
import { spacing } from "~/theme";
import { InfiniteList } from "./InfiniteList";

/** Shorten long theme names for pills (same rule as the website). */
function shortenTheme(theme: string): string {
  if (theme.length <= 35) return theme;
  const semi = theme.indexOf(";");
  if (semi > 0 && semi <= 35) return theme.slice(0, semi).trim();
  return theme.slice(0, 35).replace(/\s+\S*$/, "") + "…";
}

/** Sunday School manuals (port of ManualsList). Theme pills combine with search, as on the web. */
export function ManualList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("");
  const { data: themes } = useManualThemes();
  const combined = [search, theme].filter(Boolean).join(" ").trim();
  const q = useManualList(combined || undefined);
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.data) ?? [], [q.data]);

  const options = useMemo(
    () => [{ value: "", label: "All series" }, ...(themes ?? []).map((t) => ({ value: t, label: shortenTheme(t) }))],
    [themes],
  );

  return (
    <InfiniteList
      items={items}
      keyExtractor={(m) => String(m.id)}
      renderItem={({ item }) => (
        <ListRow
          icon={BookMarked}
          thumbnail={item.thumbnail}
          title={item.title}
          subtitle={[item.lesson, item.theme].filter(Boolean).join(" · ") || undefined}
          meta={[item.formattedDate, `${item.readingTime} min read`].filter(Boolean).join(" · ")}
          trailing={item.isScheduled ? <StatusBadge label="Coming soon" tone="accent" /> : undefined}
          // Scheduled manuals are listed but not readable until WordPress publishes them.
          onPress={
            item.isScheduled
              ? undefined
              : () =>
                  router.push({
                    pathname: "/manuals/[slug]",
                    params: { slug: item.slug, ...(search ? { q: search } : {}) },
                  })
          }
        />
      )}
      header={
        <View style={styles.header}>
          <SearchField value={search} onChangeDebounced={setSearch} placeholder="Search manuals…" />
          {options.length > 1 ? <ChipRow options={options} value={theme} onChange={setTheme} /> : null}
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
      emptyIcon={CalendarClock}
      emptyTitle="No manuals found"
      emptyMessage="Try a different search or series."
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.gutter, paddingTop: spacing.sm, gap: spacing.xs },
});
