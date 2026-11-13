import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Keyboard, Platform, View, type StyleProp, type ViewStyle } from "react-native";

/**
 * Lifts its content above the on-screen keyboard by exactly the amount the
 * keyboard covers it, on iOS and Android.
 *
 * React Native's KeyboardAvoidingView isn't enough here: with edge-to-edge
 * (mandatory from Expo SDK 58) Android no longer resizes the window for the
 * keyboard, and inside a tab screen KeyboardAvoidingView's offset depends on
 * the header height. Measuring this view's position in the window against the
 * keyboard's top edge works the same everywhere.
 */
export function KeyboardAware({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  // RN 0.88: a View's ref is its native element (which has measureInWindow).
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, height) => {
        // How far this view's bottom edge reaches below the keyboard's top.
        setInset(Math.max(0, Math.round(y + height - keyboardTop)));
      });
    });
    const onHide = Keyboard.addListener(hideEvent, () => setInset(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return (
    <View ref={ref} style={[{ flex: 1 }, style, { paddingBottom: inset }]}>
      {children}
    </View>
  );
}
