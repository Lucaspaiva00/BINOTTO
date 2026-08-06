import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors } from "@/theme/colors";

type Props = {
  title: string;
  subtitle: string;
  cancelText: string;
  confirmText: string;
  visible: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmRefuseModal({
  title,
  subtitle,
  cancelText,
  confirmText,
  visible,
  loading,
  onConfirm,
  onCancel
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          {!!subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}

          <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </Pressable>

            <Pressable
              style={styles.confirmBtn}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmText}>
                {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                ) : (
                    <Text style={styles.confirmText}>
                        {confirmText}
                    </Text>
                )}
              </Text>
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
});