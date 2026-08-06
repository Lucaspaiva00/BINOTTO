import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors } from "@/theme/colors";

type BinottoInputProps = TextInputProps & {
  label: string;
};

export function BinottoInput({ label, ...props }: BinottoInputProps): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14
  },
  label: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500"
  },
  input: {
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 15
  }
});

