import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type Props = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent?: "green";
};

export function SupportAction({
  icon,
  title,
  subtitle,
  onPress,
  accent,
}: Props) {
  const highlighted = accent === "green";

  return (
    <Pressable
      style={[
        styles.supportCard,
        highlighted && styles.supportCardWhatsapp,
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={highlighted ? "#22c55e" : colors.textMuted}
      />

      <View style={styles.supportCopy}>
        <Text
          style={[
            styles.supportTitle,
            highlighted && styles.supportTitleWhatsapp,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.supportSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  supportCard: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.backgroundBase,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  supportCardWhatsapp: {
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.08)",
  },

  supportCopy: {
    flex: 1,
    gap: 2,
  },

  supportTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  supportTitleWhatsapp: {
    color: "#22c55e",
  },

  supportSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
  },
});