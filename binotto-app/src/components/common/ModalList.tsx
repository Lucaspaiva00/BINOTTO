import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

import { colors } from "@/theme/colors";

type ModalListProps<T> = {
  visible: boolean;
  title: string;
  data: T[];
  onClose: () => void;
  onSelect: (item: T) => void;
  getLabel: (item: T) => string;
  t: any;
};

export default function ModalList<T>({
  visible,
  title,
  data,
  onClose,
  onSelect,
  getLabel,
  t,
}: ModalListProps<T>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.subtitle}>
            {t('common.selectOptionFromList')}
          </Text>

          <FlatList
            data={data}
            keyExtractor={(_, index) => String(index)}
            style={{ marginTop: 16 }}
            contentContainerStyle={{
              paddingBottom: 8,
            }}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={styles.item}
                activeOpacity={0.7}
              >
                <Text style={styles.itemText}>{getLabel(item)}</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
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
    padding: 24,
  },

  modal: {
    backgroundColor: "#141414",
    width: "100%",
    borderRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },

  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },

  subtitle: {
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 20,
  },

  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary
  },

  itemText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center"
  },

  cancelButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: colors.white,
    fontWeight: "600",
  },
});