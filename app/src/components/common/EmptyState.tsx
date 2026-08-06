import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";

type Props = {
  title: string;
  buttonText?: string;
  onPress?: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

export default function EmptyState({
  title,
  buttonText,
  onPress,
  icon = "alert-circle-outline",
}: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={56}
        color={colors.textMuted}
      />

      <Text style={styles.title}>
        {title}
      </Text>

      {buttonText && onPress && (
        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
        >
          <Text style={styles.buttonText}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },

  button: {
    marginTop: 24,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: colors.black,
    fontWeight: "700",
  },
});