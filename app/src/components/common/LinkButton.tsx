import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";

type LinkButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function LinkButton({ title, onPress, disabled = false }: LinkButtonProps): JSX.Element {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.button}>
      <Text style={[styles.text, disabled && styles.disabled]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    alignSelf: "flex-start"
  },
  text: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600"
  },
  disabled: {
    opacity: 0.45
  }
});

