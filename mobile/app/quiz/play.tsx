import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { BookOpen, CheckCircle2, Flag, Headphones, PartyPopper, XCircle } from "~/components/icons";
import { quizApi, type PublicQuestion, type SaveAnswerResult } from "~/api/quiz";
import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, Text } from "~/components";
import { useQuizSession } from "~/features/quiz/QuizSessionProvider";
import type { Recommendation } from "~/shared";
import { radius, spacing, useTheme } from "~/theme";

/** Same cadence as the website's mastery review. */
const BATCH_SIZE = 5;
const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** One question at a time; the server marks each answer (port of QuizPlayer). */
export default function QuizPlay() {
  const router = useRouter();
  const { colors } = useTheme();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { session, refresh } = useQuizSession();

  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [noMore, setNoMore] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<SaveAnswerResult | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [saving, setSaving] = useState(false);
  const [batch, setBatch] = useState({ answered: 0, correct: 0 });
  const answered = useRef<string[]>([]);

  const next = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    setResult(null);
    setRecs([]);
    try {
      const qs = await quizApi.questions(session.session_id, { category, exclude: answered.current });
      if (!qs.length) {
        setNoMore(true);
        setQuestion(null);
      } else {
        setQuestion(qs[0]);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [session, category]);

  // First question. State is only set after the request resolves, so the
  // initial render shows the loading state (loading starts true).
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    quizApi
      .questions(session.session_id, { category })
      .then((qs) => {
        if (cancelled) return;
        if (qs.length) setQuestion(qs[0]);
        else setNoMore(true);
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // Only on mount: later questions come from next().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = async () => {
    if (!session || !question || selected == null) return;
    setSaving(true);
    try {
      const r = await quizApi.saveAnswer(session.session_id, question, selected);
      answered.current = [...answered.current, question.id];
      setResult(r);
      setBatch((b) => ({ answered: b.answered + 1, correct: b.correct + (r.is_correct ? 1 : 0) }));
      Haptics.notificationAsync(
        r.is_correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
      if (!r.is_correct) setRecs(await quizApi.recommendations(question.category, question.sermon_ref));
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  };

  const finish = () => {
    refresh();
    router.replace("/quiz/results");
  };

  if (!session) return <EmptyState title="Start from the quiz home" actionLabel="Go to quiz" onAction={() => router.replace("/quiz")} />;
  if (loading && !question) return <LoadingState label="Loading question…" />;
  if (error && !question) return <ErrorState error={error} onRetry={next} />;
  if (noMore) {
    return (
      <EmptyState
        icon={PartyPopper}
        title="You've answered them all!"
        message="You've completed every question available here. Check back after the next service for more."
        actionLabel="See my results"
        onAction={finish}
      />
    );
  }
  if (!question) return null;

  const batchDone = batch.answered > 0 && batch.answered % BATCH_SIZE === 0 && result;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: `Question ${batch.answered + (result ? 0 : 1)}`,
          headerRight: () => <Button title="Finish" size="sm" variant="ghost" icon={Flag} onPress={finish} />,
        }}
      />
      <Text variant="caption" color="primary">
        {question.category}
      </Text>
      <Text variant="title" style={{ marginTop: spacing.xs, marginBottom: spacing.lg }} accessibilityRole="header">
        {question.question}
      </Text>

      <View style={{ gap: spacing.sm }}>
        {question.options.map((opt, i) => {
          const isSel = selected === i;
          const isCorrect = result && result.correct_answer === i;
          const isWrongPick = result && isSel && !result.is_correct;
          const border = isCorrect ? colors.success : isWrongPick ? colors.danger : isSel ? colors.primary : colors.border;
          return (
            <Pressable
              key={i}
              disabled={!!result}
              onPress={() => {
                setSelected(i);
                Haptics.selectionAsync().catch(() => {});
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSel, disabled: !!result }}
              accessibilityLabel={`${LETTERS[i]}. ${opt}${isCorrect ? ", correct answer" : isWrongPick ? ", your answer, incorrect" : ""}`}
              style={[styles.option, { borderColor: border, backgroundColor: isSel && !result ? colors.accentSoft : colors.surface }]}
            >
              <View style={[styles.letter, { backgroundColor: isSel || isCorrect ? border : colors.surfaceMuted }]}>
                <Text variant="label" style={{ color: isSel || isCorrect ? "#FFFFFF" : colors.textSecondary }}>
                  {LETTERS[i]}
                </Text>
              </View>
              <Text style={{ flex: 1 }}>{opt}</Text>
              {isCorrect ? <CheckCircle2 color={colors.success} size={20} /> : isWrongPick ? <XCircle color={colors.danger} size={20} /> : null}
            </Pressable>
          );
        })}
      </View>

      {result ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text variant="heading" color={result.is_correct ? "success" : "danger"}>
            {result.is_correct ? "Correct!" : "Not quite"}
          </Text>
          {result.explanation ? (
            <Text color="textSecondary" style={{ marginTop: spacing.xxs }}>
              {result.explanation}
            </Text>
          ) : null}
          {recs.length ? (
            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              <Text variant="label" color="textSecondary">
                Learn more
              </Text>
              {recs.slice(0, 2).map((r, i) => (
                <View key={i} style={styles.recRow}>
                  {r.listen_url ? (
                    <Button title={r.title ? `Listen: ${r.title}` : "Listen"} size="sm" variant="secondary" icon={Headphones} onPress={() => router.push(r.listen_url as Href)} />
                  ) : null}
                  {r.read_url ? (
                    <Button title={r.title ? `Read: ${r.title}` : "Read"} size="sm" variant="secondary" icon={BookOpen} onPress={() => router.push(r.read_url as Href)} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      {batchDone ? (
        <Card style={{ marginTop: spacing.md, backgroundColor: colors.accentSoft }}>
          <Text variant="heading">
            Round complete: {batch.correct} of {batch.answered} correct
          </Text>
          <Text color="textSecondary">Keep going, or finish to see your full results.</Text>
        </Card>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        {result ? (
          <Button title="Next question" size="lg" fullWidth loading={loading} onPress={next} />
        ) : (
          <Button title="Check answer" size="lg" fullWidth disabled={selected == null} loading={saving} onPress={confirm} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    minHeight: 56,
  },
  letter: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  recRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
