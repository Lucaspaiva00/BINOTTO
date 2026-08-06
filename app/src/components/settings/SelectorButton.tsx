import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type Props = {
  label: string;
  onPress: () => void;
};

export function SelectorButton({ label, onPress }: Props) {
  return (
    <Pressable style={styles.selectorButton} onPress={onPress}>
      <Text
        style={[
          styles.selectorButtonText,
          !label.includes("Selecione") && styles.selectorButtonTextActive,
        ]}
      >
        {label}
      </Text>

      <MaterialCommunityIcons
        name="chevron-down"
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    // backgroundColor: colors.backgroundBase,
    backgroundColor: colors.backgroundSurface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectorButtonText: {
    color: colors.textMuted,
    fontSize: 15,
  },

  selectorButtonTextActive: {
    color: colors.text,
  },
});
