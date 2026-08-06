import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useState } from "react";
import { colors } from "@/theme/colors";
import { t } from "i18next";

type Props = {
  title: string;
  subtitle?: string;
  cancelText: string;
  confirmText: string;
  visible: boolean;
  loading: boolean;
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
};

export default function ConfirmCancelAcceptModal({
  title,
  subtitle,
  cancelText,
  confirmText,
  visible,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const [motivo, setMotivo] = useState("");

  function handleConfirm() {
    onConfirm(motivo.trim());
  }

  function handleClose() {
    setMotivo("");
    onCancel();
  }

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          {!!subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}

          {/* INPUT MOTIVO */}
          <Text style={styles.label}>
            {t('common.cancelAcceptReason')}
          </Text>

          <TextInput
            value={motivo}
            onChangeText={(text) => setMotivo(text.slice(0, 50))}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            maxLength={50}
          />

          <Text style={styles.counter}>
            {motivo.length}/50
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              style={styles.confirmBtn}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
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
    borderRadius: 16,
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
    textAlign: "left",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: "left",
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
    backgroundColor: "#bc2e2e",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: colors.text,
    fontWeight: "600",
  },

  confirmText: {
    color: colors.white,
    fontWeight: "700",
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: colors.background,
  },

  counter: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "right",
  },

  confirmBtnDisabled: {
    opacity: 0.5,
  },

  label: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
});