import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Search, X } from "~/components/icons";
import { fonts, radius, spacing, useTheme } from "~/theme";

interface SearchFieldProps {
  value: string;
  /** Called with the debounced value (300 ms, as on the website). */
  onChangeDebounced: (v: string) => void;
  placeholder?: string;
  delay?: number;
}

export function SearchField({
  value,
  onChangeDebounced,
  placeholder = "Search…",
  delay = 300,
}: SearchFieldProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(value);
  // Adopt an external change to `value` (e.g. "Clear all") during render.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value);
  }

  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => onChangeDebounced(text.trim()), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Search size={18} color={colors.textMuted} />
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel={placeholder}
        onSubmitEditing={() => onChangeDebounced(text.trim())}
      />
      {text ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={12}
          onPress={() => {
            setText("");
            onChangeDebounced("");
          }}
        >
          <X size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, paddingVertical: spacing.xs },
});
