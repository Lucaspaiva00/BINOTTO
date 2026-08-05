import React, { useEffect, useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { colors } from "@/theme/colors";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
};

export function OtpInput({ value, onChange, length = 6 }: OtpInputProps): JSX.Element {
  const refs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (value.length === length) {
      refs.current[length - 1]?.blur();
    }
  }, [length, value]);

  const setCharAt = (index: number, char: string): void => {
    const chars = value.split("");
    chars[index] = char;
    onChange(chars.join("").slice(0, length));
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(input) => {
            if (input) {
              refs.current[index] = input;
            }
          }}
          value={value[index] ?? ""}
          keyboardType="number-pad"
          maxLength={1}
          style={styles.cell}
          onChangeText={(text) => {
            const char = text.replace(/\D/g, "").slice(-1);
            setCharAt(index, char);
            if (char && index < length - 1) {
              refs.current[index + 1]?.focus();
            }
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && !value[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20
  },
  cell: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700"
  }
});

