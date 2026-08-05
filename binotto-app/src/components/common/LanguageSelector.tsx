import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { colors } from "@/theme/colors";

const languages = [
  { key: "it" as const, code: "IT", label: "Italiano" },
  { key: "fr" as const, code: "FR", label: "Français" },
  { key: "pt-BR" as const, code: "BR", label: "Português" },
] as const;

type LanguageKey = (typeof languages)[number]["key"];

interface LanguageSelectorProps {
  variant?: "header" | "inline";
}

export function LanguageSelector({
  variant = "header",
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = languages.find((l) => l.key === language);

  const handleSelectLanguage = (langKey: LanguageKey) => {
    setLanguage(langKey); // Agora passando o tipo correto Language
    setModalVisible(false);
  };

  const isHeader = variant === "header";

  return (
    <View style={isHeader ? styles.headerWrapper : styles.inlineWrapper}>
      <Pressable
        style={[styles.langBadge, isHeader && styles.headerLangBadge]}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="web" size={20} color="#fff" />
        <Text style={styles.langText}>{currentLanguage?.code || "BR"}</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[styles.dropdown, isHeader && styles.headerDropdown]}
              >
                {languages.map((item) => {
                  const selected = language === item.key;

                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => handleSelectLanguage(item.key)}
                      style={[styles.item, selected && styles.itemActive]}
                    >
                      <Text
                        style={[styles.code, selected && styles.codeActive]}
                      >
                        {item.code}
                      </Text>
                      <Text
                        style={[styles.label, selected && styles.labelActive]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: "relative",
  },
  inlineWrapper: {
    position: "relative",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  langBadge: {
    paddingHorizontal: 11,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#6c5e1700",
    backgroundColor: "#938423",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  headerLangBadge: {
    marginBottom: 16,
  },
  langText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    width: 190,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 8,
  },
  headerDropdown: {
    // Estilos específicos para o header se necessário
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: "#2B2B2B",
  },
  code: {
    color: colors.textMuted,
    fontSize: 14,
    width: 28,
  },
  codeActive: {
    color: "#FFFFFF",
  },
  label: {
    color: colors.textMuted,
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
