// Must run before any module touches localStorage (theme, reused web modules).
import "expo-sqlite/localStorage/install";

import { useEffect } from "react";
import { View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
  Stack,
  type ErrorBoundaryProps,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
  Jost_700Bold,
  useFonts,
} from "@expo-google-fonts/jost";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorState, OfflineBanner } from "~/components";
import { installApiFetch } from "~/lib/apiFetch";
import {
  PERSIST_BUSTER,
  PERSIST_MAX_AGE,
  queryClient,
  queryPersister,
  wireQueryManagers,
} from "~/lib/queryClient";
import { PlayerProvider } from "~/player/PlayerProvider";
import { fonts, ThemeProvider, useTheme } from "~/theme";

installApiFetch();
wireQueryManagers();
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Fall back to the system font rather than block the app if Jost fails.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: queryPersister,
              buster: PERSIST_BUSTER,
              maxAge: PERSIST_MAX_AGE,
              dehydrateOptions: {
                // Only successful data, and never queries that opt out
                // (e.g. Firestore cursors, which can't be serialised).
                shouldDehydrateQuery: (q) => q.state.status === "success" && q.meta?.persist !== false,
              },
            }}
          >
            <PlayerProvider>
              <AppStack />
            </PlayerProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppStack() {
  const { scheme, colors } = useTheme();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <OfflineBanner />
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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="player" options={{ presentation: "modal", headerShown: false }} />
        </Stack>
      </View>
    </NavThemeProvider>
  );
}

/** Route-level error boundary (port of the web's error.tsx). */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ErrorState error={error} onRetry={retry} />
    </View>
  );
}
