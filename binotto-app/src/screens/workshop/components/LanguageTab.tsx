import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme/colors";
import { useLanguage } from "@/contexts/LanguageContext";

const languages = [
  { key: "it", code: "IT", label: "Italiano", flag: "🇮🇹" },
  { key: "fr", code: "FR", label: "Français", flag: "🇫🇷" },
  { key: "pt-BR", code: "BR", label: "Português", flag: "🇧🇷" },
  // { key: "en", code: "EN", label: "English" },
] as const;

export default function LanguageTab() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {t("workshopSettingsScreen.language.title")}
      </Text>

      <Text style={styles.subtitle}>
        {t("workshopSettingsScreen.language.subtitle")}
      </Text>

      <View style={styles.list}>
        {languages.map((lang) => {
          const selected = lang.key === language;

          return (
            <Pressable
              key={lang.key}
              onPress={() => setLanguage(lang.key)}
              style={[styles.item, selected && styles.itemSelected]}
            >
              <View style={styles.left}>
                <Text style={{ fontSize: 24 }}>{lang.flag}</Text>

                <Text
                  style={[styles.itemText, selected && styles.itemTextSelected]}
                >
                  {lang.label}
                </Text>
              </View>

              {selected && (
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color={colors.primary}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },

  list: {
    gap: 10,
    marginTop: 8,
  },

  item: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.backgroundBase,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(255, 193, 7, 0.12)",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  codeBadge: {
    width: 38,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },

  codeBadgeSelected: {
    borderColor: colors.primary,
  },

  codeText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
  },

  codeTextSelected: {
    color: colors.primary,
  },

  itemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  itemTextSelected: {
    color: colors.primary,
  },
});
