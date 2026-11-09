import type { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { spacing, useTheme } from "~/theme";

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). Use false for FlatList screens. */
  scroll?: boolean;
  /** Safe-area edges to pad. Stack screens with a header usually want only bottom/sides. */
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  scrollProps?: ScrollViewProps;
}

export function Screen({
  children,
  scroll = true,
  edges = ["left", "right"],
  refreshing = false,
  onRefresh,
  padded = true,
  contentStyle,
  scrollProps,
}: ScreenProps) {
  const { colors } = useTheme();
  const pad = padded ? styles.padded : undefined;

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { paddingHorizontal: spacing.gutter, paddingTop: spacing.md },
  scrollContent: { paddingBottom: spacing.huge * 2 },
});
