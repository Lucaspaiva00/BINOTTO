import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";

type Option = {
  label: string;
  value: string | number;
};

type Props = {
  label?: string;
  value: string | number | null;
  options: Option[];
  placeholder?: string;
  onChange: (value: string | number) => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  colorText?: string;
};

export function Select({
  label,
  colorText,
  value,
  options,
  placeholder = "Selecione",
  onChange,
  icon,
  style,
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = options.find((item) => item.value === value);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={{ ...styles.label, color: colorText }}>{label}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, style]}
        onPress={() => setOpen((prev) => !prev)}
      >
        <View style={styles.buttonContent}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={colors.textMuted}
            />
          )}

          <Text
            style={[styles.buttonText, selected && styles.buttonTextSelected]}
          >
            {selected?.label ?? placeholder}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {options.map((item) => (
            <TouchableOpacity
              key={String(item.value)}
              style={[
                styles.option,
                value === item.value && styles.optionActive,
              ]}
              onPress={() => {
                onChange(item.value);
                setOpen(false);
              }}
            >
              <View style={styles.optionContent}>
                {value === item.value && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={colors.text}
                  />
                )}

                <Text style={styles.optionText}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 100,
  },

  label: {
    marginBottom: 8,
    color: colors.textMuted,
    fontWeight: "500",
  },

  button: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSurface,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  buttonText: {
    color: colors.text,
    fontWeight: "500",
  },

  buttonTextSelected: {
    color: colors.white,
  },

  dropdown: {
    position: "absolute",
    top: 90,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    zIndex: 999,
    elevation: 10,
  },

  option: {
    padding: 12,
    borderRadius: 10,
  },

  optionActive: {
    backgroundColor: colors.surface,
  },

  optionText: {
    color: colors.text,
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
