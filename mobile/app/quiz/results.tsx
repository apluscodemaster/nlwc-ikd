import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Brain, Trophy } from "~/components/icons";
import { quizApi } from "~/api/quiz";
import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, SectionHeader, Text } from "~/components";
import { useQuizSession } from "~/features/quiz/QuizSessionProvider";
import { radius, spacing, useTheme } from "~/theme";

/** Overall results by category (port of QuizResults, from /api/quiz/progress). */
export default function QuizResults() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useQuizSession();
  const q = useQuery({
    queryKey: ["quiz-progress", session?.session_id],
    enabled: !!session,
    queryFn: () => quizApi.progress(session!.session_id),
    staleTime: 0,
  });

  if (!session) return <EmptyState title="No quiz yet" actionLabel="Go to quiz" onAction={() => router.replace("/quiz")} />;
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const r = q.data;
  if (!r.total_questions) {
    return <EmptyState icon={Brain} title="No answers yet" message="Play a round to see your results." actionLabel="Start quiz" onAction={() => router.replace("/quiz/play")} />;
  }

  return (
    <Screen>
      <Card style={{ alignItems: "center", backgroundColor: colors.accentSoft }}>
        <Text variant="display" color="primary">
          {Math.round(r.score_percent)}%
        </Text>
        <Text color="textSecondary">
          {r.correct_answers} of {r.total_questions} answered correctly
        </Text>
      </Card>

      <SectionHeader label="By category" />
      <Card>
        {Object.entries(r.by_category).map(([cat, v]) => {
          if (!v) return null;
          const pct = v.total ? v.correct / v.total : 0;
          return (
            <View key={cat} style={{ marginBottom: spacing.md }}>
              <View style={styles.rowBetween}>
                <Text variant="label">{cat}</Text>
                <Text variant="small" color="textSecondary">
                  {v.correct}/{v.total}
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
                <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: pct >= 0.7 ? colors.success : colors.primary }]} />
              </View>
            </View>
          );
        })}
      </Card>

      {r.recommendations?.length ? (
        <>
          <SectionHeader label="Recommended for you" />
          <View style={{ gap: spacing.xs }}>
            {r.recommendations.slice(0, 4).map((rec, i) => (
              <Card key={i}>
                <Text variant="bodyStrong">{rec.title ?? rec.category}</Text>
                <Text variant="small" color="textSecondary">
                  {rec.reason}
                </Text>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <Button title="Play again" icon={Brain} onPress={() => router.replace("/quiz/play")} />
        <Button title="Leaderboard" variant="secondary" icon={Trophy} onPress={() => router.push("/quiz/leaderboard")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  track: { height: 8, borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: 8, borderRadius: radius.pill },
  actions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xl, flexWrap: "wrap" },
});
