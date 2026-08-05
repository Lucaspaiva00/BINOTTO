import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors } from "@/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  variant?: "single" | "double";
  type?: "success" | "error" | "warning" | "info" | "none";
  confirmText?: string;
  cancelText?: string;
  textAlign?: "left" | "center";
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

const iconConfig = {
  success: {
    name: "check-circle",
    color: colors.success,
  },
  error: {
    name: "close-circle",
    color: colors.danger,
  },
  warning: {
    name: "alert-circle",
    color: "#F59E0B",
  },
  info: {
    name: "information",
    color: colors.primary,
  },
} as const;

export default function ConfirmModal({
  visible,
  title,
  subtitle,
  variant = "single",
  type = "none",
  confirmText = "OK",
  cancelText = "Cancelar",
  textAlign = "center",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>

          {type !== "none" && type && iconConfig[type] && (
            <View style={styles.iconBox}>
                <MaterialCommunityIcons
                name={iconConfig[type].name as any}
                size={34}
                color={iconConfig[type].color}
                />
            </View>
          )}

          <Text style={[styles.title, { textAlign }]}>{title}</Text>

          {!!subtitle && (
            <Text style={[styles.subtitle, { textAlign }]}>{subtitle}</Text>
          )}

          <View style={styles.actions}>
            {variant === "double" && (
              <Pressable 
                style={styles.cancelBtn} 
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.confirmBtn,
                variant === "single" && { flex: 1 },
                loading && styles.disabledBtn,
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.confirmText}>
                  {confirmText}
                </Text>
              )}
            </Pressable>
          </View>
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
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  iconBox: {
    alignItems: "center",
    marginBottom: 10,
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

  message: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  actions: {
    flexDirection: "row",
    marginTop: 18,
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: colors.text,
    fontWeight: "600",
  },

  confirmText: {
    color: colors.black,
    fontWeight: "800",
  },

  disabledBtn: {
    opacity: 0.7,
  },
});