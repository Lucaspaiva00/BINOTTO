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

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AddressRequiredModal({
  visible,
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
              name="map-marker-alert"
              size={40}
              color="#F59E0B"
            />
          </View>

          <Text style={styles.title}>
            {t("addressRequiredModal.title")}
          </Text>

          <Text style={styles.subtitle}>
            {t("addressRequiredModal.subtitle")}
          </Text>

          <Text style={styles.message}>
             {t("addressRequiredModal.message")}
          </Text>

          <Pressable
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {t("addressRequiredModal.button")}
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
    backgroundColor: colors.backgroundSurface,
    padding: 24,
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
    marginTop: 8,
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
  },

  message: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  button: {
    marginTop: 24,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 15,
  },
});