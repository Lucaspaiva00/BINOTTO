import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "@/components/common/ScreenContainer";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { OtpInput } from "@/components/forms/OtpInput";
import { PublicStackParamList } from "@/routes/types";
import { colors } from "@/theme/colors";
import PasswordService from "@/services/PasswordService";
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<PublicStackParamList, "OtpValidation">;

export function OtpValidationScreen({ route, navigation }: Props): JSX.Element {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"otp" | "reset">("otp");
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const handleValidateOtp = async (): Promise<void> => {
    if (otp.length < 6) return;

    setIsSubmitting(true);
    try {
      const response = await PasswordService.confirmRecoveryCode(otp);
      setUsuarioId(response.usuario_id);
      setStep("reset");
    } catch (error: any) {
      const message =
        error?.message || t("otpValidationScreen.validateCodeError");
      Alert.alert(t("otpValidationScreen.validationFailedTitle"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!novaSenha || !confirmarSenha) {
      Alert.alert(
        t("resetPasswordScreen.requiredFields"),
        t("resetPasswordScreen.fillAllFields"),
      );
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert(
        t("resetPasswordScreen.passwordMismatch"),
        t("resetPasswordScreen.passwordMismatchMessage"),
      );
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert(
        t("resetPasswordScreen.passwordTooShort"),
        t("resetPasswordScreen.passwordMinLength"),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await PasswordService.resetPassword(
        usuarioId!,
        novaSenha,
        confirmarSenha,
      );
      Alert.alert(
        t("resetPasswordScreen.successTitle"),
        t("resetPasswordScreen.successMessage"),
        [
          {
            text: t("resetPasswordScreen.ok"),
            onPress: () => navigation.navigate("Login"),
          },
        ],
      );
    } catch (error: any) {
      const message = error?.message || t("resetPasswordScreen.resetError");
      Alert.alert(t("resetPasswordScreen.errorTitle"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "otp") {
    return (
      <ScreenContainer removeSafeArea padding={24}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("otpValidationScreen.title")}</Text>
          <Text style={styles.subtitle}>
            {t("otpValidationScreen.subtitle", { email: route.params.email })}
          </Text>
        </View>
        <OtpInput value={otp} onChange={setOtp} length={6} />
        <PrimaryButton
          title={
            isSubmitting
              ? t("otpValidationScreen.validating")
              : t("otpValidationScreen.validateCode")
          }
          onPress={handleValidateOtp}
          disabled={otp.length < 6 || isSubmitting}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer removeSafeArea padding={24}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("resetPasswordScreen.title")}</Text>
        <Text style={styles.subtitle}>{t("resetPasswordScreen.subtitle")}</Text>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("resetPasswordScreen.newPassword")}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={novaSenha}
          onChangeText={setNovaSenha}
          placeholder={t("resetPasswordScreen.newPasswordPlaceholder")}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          {t("resetPasswordScreen.confirmPassword")}
        </Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          placeholder={t("resetPasswordScreen.confirmPasswordPlaceholder")}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />
      </View>
      <PrimaryButton
        title={
          isSubmitting
            ? t("resetPasswordScreen.resetting")
            : t("resetPasswordScreen.resetPassword")
        }
        onPress={handleResetPassword}
        disabled={isSubmitting}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
