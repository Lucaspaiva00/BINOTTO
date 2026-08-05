import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { colors } from "@/theme/colors";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  multiline?: boolean;
  disabled?: boolean;
  colorText?: string;
};

export function Input({
  label,
  colorText,
  error,
  multiline = false,
  disabled = false,
  style,
  placeholder,
  ...props
}: Props) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={{ ...styles.label, color: colorText ?? colors.textMuted }}>
          {label}
        </Text>
      )}

      <TextInput
        editable={!disabled}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          multiline && styles.multiline,
          disabled && styles.disabledInput,
          error && styles.inputError,
          style,
        ]}
        {...props}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  label: {
    fontWeight: "500",
    color: colors.textMuted,
  },

  input: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
    fontWeight: "400",
  },

  multiline: {
    minHeight: 120,
    paddingTop: 16,
    textAlignVertical: "top",
  },

  disabledInput: {
    opacity: 0.5,
  },

  inputError: {
    borderColor: colors.danger,
  },

  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "500",
  },
});
