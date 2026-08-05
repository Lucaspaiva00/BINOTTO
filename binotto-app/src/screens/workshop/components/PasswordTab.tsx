import React from "react";
import { View, TextInput, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme/colors";
import { PasswordForm, PasswordRequirement } from "@/types/password";
import { SuccessAlert } from "@/components/common/SuccessAlert";
import { ErrorAlert } from "@/components/common/ErrorAlert";

type Props = {
  passwordForm: PasswordForm;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordForm>>;
  passwordRequirements: PasswordRequirement[];
  changingLoading: boolean;
  onSubmit: () => void;
  onForgotPassword: () => void;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  success: string | null;
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function PasswordTab({
  passwordForm,
  setPasswordForm,
  passwordRequirements,
  changingLoading,
  onSubmit,
  onForgotPassword,
  error,
  setError,
  success,
  setSuccess,
}: Props) {
  const { t } = useTranslation();
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <>
      {error && (
        <View style={{ marginBottom: 16 }}>
          <ErrorAlert message={error} onClose={() => setError(null)} />
        </View>
      )}

      {success && (
        <View style={{ marginBottom: 16 }}>
          <SuccessAlert message={success} onClose={() => setSuccess(null)} />
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.inputWrapper}>
          <TextInput
            autoCapitalize="none"
            placeholder={t("workshopSettingsScreen.password.currentPassword")}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showCurrent}
            style={styles.input}
            value={passwordForm.currentPassword}
            onChangeText={(text) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: text,
              }))
            }
          />

          <Pressable
            onPress={() => setShowCurrent((prev) => !prev)}
            style={styles.eye}
          >
            <MaterialCommunityIcons
              name={showCurrent ? "eye-off" : "eye"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Pressable onPress={onForgotPassword}>
          <Text style={styles.link}>
            {t("workshopSettingsScreen.password.forgotPassword")}
          </Text>
        </Pressable>

        <View style={styles.inputWrapper}>
          <TextInput
            autoCapitalize="none"
            placeholder={t("workshopSettingsScreen.password.newPassword")}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showNew}
            style={styles.input}
            value={passwordForm.newPassword}
            onChangeText={(text) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: text,
              }))
            }
          />

          <Pressable
            onPress={() => setShowNew((prev) => !prev)}
            style={styles.eye}
          >
            <MaterialCommunityIcons
              name={showNew ? "eye-off" : "eye"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <View style={styles.requirementsList}>
          {passwordRequirements.map((item) => (
            <View key={item.label} style={styles.requirementRow}>
              <View
                style={[
                  styles.requirementIcon,
                  item.met && styles.requirementIconActive,
                ]}
              >
                {item.met && (
                  <MaterialCommunityIcons
                    name="check"
                    size={12}
                    color={colors.black}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.requirementText,
                  item.met && styles.requirementTextActive,
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            autoCapitalize="none"
            placeholder={t("workshopSettingsScreen.password.confirmPassword")}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showConfirm}
            style={styles.input}
            value={passwordForm.confirmPassword}
            onChangeText={(text) =>
              setPasswordForm((prev) => ({
                ...prev,
                confirmPassword: text,
              }))
            }
          />

          <Pressable
            onPress={() => setShowConfirm((prev) => !prev)}
            style={styles.eye}
          >
            <MaterialCommunityIcons
              name={showConfirm ? "eye-off" : "eye"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, changingLoading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={changingLoading}
        >
          <Text style={styles.buttonText}>
            {changingLoading
              ? t("workshopSettingsScreen.password.saving")
              : t("workshopSettingsScreen.password.save")}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },

  input: {
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 54,
    color: colors.text,
    fontSize: 15,
  },

  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  eye: {
    position: "absolute",
    right: 14,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  link: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },

  requirementsList: {
    gap: 8,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  requirementIcon: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  requirementIconActive: {
    backgroundColor: "#22c55e",
  },

  requirementText: {
    color: colors.textMuted,
    fontSize: 13,
  },

  requirementTextActive: {
    color: "#22c55e",
  },

  button: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.7,
  },
});
