import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Brain, KeyRound, ShieldCheck, Trophy } from "~/components/icons";
import { ApiError } from "~/api/client";
import { quizApi } from "~/api/quiz";
import { FormField } from "~/components/FormField";
import { Button, Card, Chip, LoadingState, Screen, SectionHeader, Sheet, Text } from "~/components";
import { useQuizSession } from "~/features/quiz/QuizSessionProvider";
import { QUIZ_CATEGORIES, SECURITY_QUESTIONS } from "~/shared";
import { spacing, useTheme } from "~/theme";

/** Quiz launcher (port of QuizLauncher + UsernamePrompt + recovery/security modals). */
export default function QuizHome() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session, loading } = useQuizSession();
  const [category, setCategory] = useState<string>("");
  const [showSecurity, setShowSecurity] = useState(false);

  if (loading) return <LoadingState />;
  if (!session) return <UsernamePrompt />;

  return (
    <Screen>
      <Card style={{ backgroundColor: colors.accentSoft }}>
        <Text variant="caption" color="primary">
          Welcome back
        </Text>
        <Text variant="title">{session.username}</Text>
        <View style={styles.stats}>
          <Stat label="Total score" value={session.total_score} />
          <Stat label="Quizzes taken" value={session.quizzes_taken} />
        </View>
      </Card>

      {!session.security_set ? (
        <Card
          style={{ marginTop: spacing.md }}
          onPress={() => setShowSecurity(true)}
          accessibilityLabel="Protect your progress"
        >
          <View style={styles.row}>
            <ShieldCheck color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Protect your progress</Text>
              <Text variant="small" color="textSecondary">
                Set a security question so you can restore your score on a new phone.
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      <SectionHeader label="Choose a category" />
      <View style={styles.chips}>
        <Chip label="All categories" selected={!category} onPress={() => setCategory("")} />
        {QUIZ_CATEGORIES.map((c) => (
          <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>

      <Button
        title="Start quiz"
        icon={Brain}
        size="lg"
        fullWidth
        style={{ marginTop: spacing.xl }}
        onPress={() => router.push({ pathname: "/quiz/play", params: category ? { category } : {} })}
      />
      <View style={styles.row2}>
        <Button
          title="Leaderboard"
          variant="secondary"
          icon={Trophy}
          onPress={() => router.push("/quiz/leaderboard")}
        />
        <Button title="My results" variant="secondary" onPress={() => router.push("/quiz/results")} />
      </View>

      <SecuritySheet visible={showSecurity} onClose={() => setShowSecurity(false)} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="display">{value}</Text>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

function UsernamePrompt() {
  const { colors } = useTheme();
  const { createSession } = useQuizSession();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState(false);
  // Required at sign-up: it's the only way back to this score on another phone.
  const [question, setQuestion] = useState<string>(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState("");

  const start = async () => {
    if (name.trim().length < 2) return setError("Please enter at least 2 characters.");
    if (answer.trim().length < 2) return setAnswerError("Please enter an answer you'll remember.");
    setBusy(true);
    setError("");
    setAnswerError("");
    try {
      await createSession(name, { question, answer });
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 409
          ? "That name is taken. If it's yours, restore your progress below."
          : e instanceof Error
            ? e.message
            : "Couldn't start. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Text variant="title">Bible Knowledge Quiz</Text>
      <Text color="textSecondary" style={{ marginVertical: spacing.sm }}>
        Test what you've learned from our messages. Pick a name for the leaderboard — no account needed.
      </Text>
      <FormField
        label="Your quiz name"
        value={name}
        onChangeText={setName}
        error={error}
        autoCapitalize="words"
        maxLength={30}
      />
      <Card style={{ marginTop: spacing.md, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text variant="label">Protect your score</Text>
        </View>
        <Text variant="small" color="textSecondary">
          You'll need this answer to get your score back on another phone. Not case-sensitive.
        </Text>
        <View style={styles.chips}>
          {SECURITY_QUESTIONS.map((q) => (
            <Chip key={q} label={q} selected={question === q} onPress={() => setQuestion(q)} />
          ))}
        </View>
        <FormField
          label="Your answer"
          value={answer}
          onChangeText={(v) => {
            setAnswer(v);
            setAnswerError("");
          }}
          error={answerError}
          autoCapitalize="none"
          maxLength={200}
        />
      </Card>
      <Button
        title="Start playing"
        icon={Brain}
        size="lg"
        fullWidth
        loading={busy}
        onPress={start}
        style={{ marginTop: spacing.md }}
      />
      <Button
        title="I've played before — restore my progress"
        variant="ghost"
        icon={KeyRound}
        onPress={() => setRecovering(true)}
        style={{ marginTop: spacing.sm }}
      />
      <RecoverSheet visible={recovering} onClose={() => setRecovering(false)} />
    </Screen>
  );
}

function RecoverSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { adoptSession } = useQuizSession();
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"name" | "answer" | "code">("name");
  const [question, setQuestion] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep("name");
    setValue("");
    setError("");
    onClose();
  };

  const lookup = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await quizApi.recoverLookup(username);
      setQuestion(r.question);
      setStep(r.question ? "answer" : "code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't find that name.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!value.trim()) return setError(step === "code" ? "Enter your recovery code." : "Enter your answer.");
    setBusy(true);
    setError("");
    try {
      const r = await quizApi.recover(username, step === "code" ? { code: value.trim() } : { answer: value });
      await adoptSession(r.session_id, r.username);
      reset();
      Alert.alert("Welcome back!", `Your progress as ${r.username} has been restored.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not verify.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={reset} title="Restore your progress">
      <View style={{ gap: spacing.md }}>
        {step === "name" ? (
          <>
            <FormField
              label="Your quiz name"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              error={error}
            />
            <Button title="Continue" fullWidth loading={busy} disabled={!username.trim()} onPress={lookup} />
          </>
        ) : (
          <>
            <Text color="textSecondary">
              {step === "answer" ? question : "Enter the recovery code the church admin gave you."}
            </Text>
            <FormField
              label={step === "answer" ? "Your answer" : "Recovery code"}
              value={value}
              onChangeText={setValue}
              autoCapitalize={step === "code" ? "characters" : "none"}
              error={error}
            />
            <Button title="Restore" fullWidth loading={busy} onPress={verify} />
            {step === "answer" ? (
              <Button
                title="I have a recovery code instead"
                variant="ghost"
                onPress={() => {
                  setStep("code");
                  setValue("");
                  setError("");
                }}
              />
            ) : null}
          </>
        )}
      </View>
    </Sheet>
  );
}

function SecuritySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { session, markSecuritySet } = useQuizSession();
  const [question, setQuestion] = useState<string>(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!session) return;
    if (answer.trim().length < 2) return setError("Please enter an answer you'll remember.");
    setBusy(true);
    setError("");
    try {
      await quizApi.setSecurity(session.session_id, question, answer);
      markSecuritySet();
      setAnswer("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Set a security question">
      <View style={{ gap: spacing.sm }}>
        <Text color="textSecondary">Choose a question only you can answer.</Text>
        <View style={styles.chips}>
          {SECURITY_QUESTIONS.map((q) => (
            <Chip key={q} label={q} selected={question === q} onPress={() => setQuestion(q)} />
          ))}
        </View>
        <FormField label="Answer" value={answer} onChangeText={setAnswer} error={error} autoCapitalize="none" />
        <Button title="Save" fullWidth loading={busy} onPress={save} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", marginTop: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  row2: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm, flexWrap: "wrap" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
