import { Text, TextInput, TextInputProps, View, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { colors } from "@/theme/colors";

type Props = TextInputProps & {
  error?: string;
  disabled?: boolean;
};

export function SearchInput({
  error,
  disabled = false,
  style,
  placeholder,
  ...props
}: Props) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          disabled && styles.disabledInput,
          error && styles.inputError,
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={colors.placeholder}
        />

        <TextInput
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, style]}
          {...props}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  inputContainer: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "400",
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