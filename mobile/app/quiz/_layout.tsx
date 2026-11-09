import { Stack } from "expo-router";
import { QuizSessionProvider } from "~/features/quiz/QuizSessionProvider";
import { fonts, useTheme } from "~/theme";

export default function QuizLayout() {
  const { colors } = useTheme();
  return (
    <QuizSessionProvider>
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { fontFamily: fonts.semibold, color: colors.text },
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Bible Quiz" }} />
        <Stack.Screen name="play" options={{ title: "Quiz", gestureEnabled: false }} />
        <Stack.Screen name="results" options={{ title: "Your results" }} />
        <Stack.Screen name="leaderboard" options={{ title: "Leaderboard" }} />
      </Stack>
    </QuizSessionProvider>
  );
}
