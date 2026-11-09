import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { radius, spacing, useTheme } from "~/theme";
import { IconButton } from "./IconButton";
import { Text } from "./Text";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Max height as a fraction of the screen (default 0.8). */
  maxHeight?: `${number}%`;
  scroll?: boolean;
}

/** Bottom sheet (web ui/sheet + dialog). */
export function Sheet({ visible, onClose, title, children, maxHeight = "80%", scroll = true }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
        accessibilityLabel="Close"
        accessibilityRole="button"
      />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, maxHeight, paddingBottom: insets.bottom + spacing.md },
        ]}
        accessibilityViewIsModal
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        <View style={styles.header}>
          <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
            {title}
          </Text>
          <IconButton icon={X} accessibilityLabel="Close" onPress={onClose} size={20} />
        </View>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={styles.body}>{children}</View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: spacing.xs },
  header: { flexDirection: "row", alignItems: "center", paddingLeft: spacing.lg, paddingRight: spacing.xs },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
