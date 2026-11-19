import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "~/components/icons";
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
  const { height: windowHeight } = useWindowDimensions();
  const { ref: windowRef, inset: keyboardInset } = useKeyboardLift(visible);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View ref={windowRef} style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />
        <View
          style={[
            styles.sheet,
            keyboardInset > 0
              ? {
                  backgroundColor: colors.surface,
                  bottom: keyboardInset,
                  // Keep the whole sheet (title and field) on screen above the keyboard.
                  maxHeight: windowHeight - keyboardInset - insets.top - spacing.md,
                  paddingBottom: spacing.md,
                }
              : {
                  backgroundColor: colors.surface,
                  maxHeight,
                  paddingBottom: insets.bottom + spacing.md,
                },
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
      </View>
    </Modal>
  );
}

/**
 * How far the keyboard covers the bottom of the sheet window. With
 * edge-to-edge (Expo SDK 58) Android no longer resizes the modal window for
 * the keyboard, so a bottom sheet would sit behind it; measuring the window
 * against the keyboard top gives 0 wherever the OS does resize it.
 */
function useKeyboardLift(visible: boolean) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [inset, setInset] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, height) => {
        setInset(Math.max(0, Math.round(y + height - keyboardTop)));
      });
    });
    const onHide = Keyboard.addListener(hideEvent, () => setInset(0));
    return () => {
      onShow.remove();
      onHide.remove();
      setInset(0);
    };
  }, [visible]);
  return { ref, inset };
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
