import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { fonts, radius, spacing, useTheme } from "~/theme";
import { Text } from "./Text";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled text input with error text (web ui/input + form). */
export function FormField({ label, error, hint, multiline, style, ...rest }: FormFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="small" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" color="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    minHeight: 46,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  multiline: { minHeight: 130, paddingTop: spacing.sm },
});
