import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react-native";
import { EmptyState, ErrorState, ListSkeleton, SearchField, Text } from "~/components";
import { searchBible } from "~/shared";
import { spacing, useTheme } from "~/theme";

/** KJV search (port of BibleSearch): keywords ("good shepherd") or references ("John 3:16"). */
export default function BibleSearchScreen() {
  const { colors } = useTheme();
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["bible-search", q],
    enabled: q.length >= 2,
    queryFn: ({ signal }) => searchBible(q, signal),
    staleTime: Infinity,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Search the Bible" }} />
      <View style={styles.search}>
        <SearchField value={q} onChangeDebounced={setQ} placeholder='Try "good shepherd" or John 3:16' />
      </View>
      <FlatList
        data={q.length >= 2 ? (query.data ?? []) : []}
        keyExtractor={(v) => v.id}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: spacing.huge }}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: colors.border }]} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text variant="label" color="primary">
              {item.ref}
            </Text>
            <Text variant="reader" style={{ fontSize: 17, lineHeight: 27 }} selectable>
              {item.text}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          q.length < 2 ? (
            <EmptyState icon={BookOpen} title="King James Version" message="Search by word, phrase or reference." />
          ) : query.isLoading ? (
            <ListSkeleton rows={4} />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState icon={BookOpen} title="No verses found" message={`Nothing matched “${q}”.`} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { padding: spacing.gutter, paddingBottom: spacing.xs },
  item: { paddingVertical: spacing.md, gap: spacing.xxs },
  sep: { height: StyleSheet.hairlineWidth },
});
