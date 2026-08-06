import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { t } from "i18next";

type Option = {
  key: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: Option[];
  onClose: () => void;
};

export default function DocumentSourceModal({
  visible,
  title,
  subtitle,
  options,
  onClose,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons
              name="file-document-plus-outline"
              size={34}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>{title}</Text>

          {!!subtitle && (
            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          )}

          <View style={styles.options}>
            {options.map((option) => (
              <Pressable
                key={option.key}
                style={styles.option}
                onPress={option.onPress}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={22}
                      color={colors.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>
                      {option.title}
                    </Text>

                    {!!option.subtitle && (
                      <Text style={styles.optionSubtitle}>
                        {option.subtitle}
                      </Text>
                    )}
                  </View>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={colors.textMuted}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  container: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: colors.background2,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconBox: {
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  options: {
    marginTop: 20,
    gap: 10,
  },

  option: {
    minHeight: 62,
    borderRadius: 14,
    backgroundColor: colors.card_item,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.backgroundBase,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  optionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },

  optionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  cancelButton: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: colors.text,
    fontWeight: "700",
  },
});