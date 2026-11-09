import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react-native";
import { quizApi } from "~/api/quiz";
import { EmptyState, ErrorState, ListSkeleton, Text } from "~/components";
import { useQuizSession } from "~/features/quiz/QuizSessionProvider";
import { radius, spacing, useTheme } from "~/theme";

const MEDALS = ["#F59E0B", "#9CA3AF", "#B45309"];

/** Top players (port of Leaderboard). Rows carry no session ids; "you" is matched by username. */
export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { session } = useQuizSession();
  const q = useQuery({ queryKey: ["quiz-leaderboard"], queryFn: quizApi.leaderboard, staleTime: 60 * 1000 });

  if (q.isLoading) return <ListSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const me = session?.username.toLowerCase();

  return (
    <FlatList
      data={q.data ?? []}
      keyExtractor={(e) => e.username}
      contentContainerStyle={{ padding: spacing.gutter, gap: spacing.xs, paddingBottom: spacing.huge }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
      ListEmptyComponent={<EmptyState icon={Trophy} title="No scores yet" message="Be the first on the board!" />}
      renderItem={({ item, index }) => {
        const mine = item.username.toLowerCase() === me;
        return (
          <View
            style={[styles.row, { backgroundColor: mine ? colors.accentSoft : colors.surface, borderColor: mine ? colors.primary : colors.border }]}
            accessible
            accessibilityLabel={`Rank ${index + 1}, ${item.username}${mine ? " (you)" : ""}, ${item.total_score} points`}
          >
            <View style={[styles.rank, { backgroundColor: MEDALS[index] ?? colors.surfaceMuted }]}>
              <Text variant="label" style={{ color: index < 3 ? "#FFFFFF" : colors.textSecondary }}>
                {index + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">
                {item.username}
                {mine ? " (you)" : ""}
              </Text>
              <Text variant="small" color="textMuted">
                {item.quizzes_taken} quiz{item.quizzes_taken === 1 ? "" : "zes"}
              </Text>
            </View>
            <Text variant="heading" color="primary">
              {item.total_score}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1 },
  rank: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
});
