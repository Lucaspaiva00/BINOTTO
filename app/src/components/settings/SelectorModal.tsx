import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type Option = {
  value: string;
  label: string;
};

type Props = {
  visible: boolean;
  title: string;
  subtitle: string;
  options: Option[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
};

export function SelectorModal({
  visible,
  title,
  subtitle,
  options,
  selectedValue,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
            </View>

            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalOptions}>
            {options.map((option) => {
              const selected = option.value === selectedValue;

              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.modalOption,
                    selected && styles.modalOptionSelected,
                  ]}
                  onPress={() => onSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>

                  {selected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    maxHeight: "80%",
    backgroundColor: colors.backgroundSurface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 20,
    gap: 16,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  modalHeaderCopy: {
    flex: 1,
  },

  modalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },

  modalOptions: {
    gap: 10,
  },

  modalOption: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#201a08",
  },

  modalOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },

  modalOptionTextSelected: {
    color: colors.primary,
  },
});