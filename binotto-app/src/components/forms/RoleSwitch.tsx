import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AccountType } from "@/types/auth";
import { colors } from "@/theme/colors";

type RoleSwitchProps = {
  value: AccountType;
  onChange: (type: AccountType) => void;
};

export function RoleSwitch({ value, onChange }: RoleSwitchProps): JSX.Element {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.option, value === "TECHNICIAN" && styles.optionActive]}
        onPress={() => onChange("TECHNICIAN")}
      >
        <Text style={[styles.optionText, value === "TECHNICIAN" && styles.optionTextActive]}>Técnico</Text>
      </Pressable>

      <Pressable
        style={[styles.option, value === "WORKSHOP" && styles.optionActive]}
        onPress={() => onChange("WORKSHOP")}
      >
        <Text style={[styles.optionText, value === "WORKSHOP" && styles.optionTextActive]}>Oficina</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  option: {
    flex: 1,
    borderRadius: 8,
    height: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  optionActive: {
    backgroundColor: colors.primary
  },
  optionText: {
    color: colors.textMuted,
    fontWeight: "600"
  },
  optionTextActive: {
    color: colors.background
  }
});

