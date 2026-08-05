import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { ScreenContainer } from "@/components/common/ScreenContainer";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { BinottoInput } from "@/components/forms/BinottoInput";
import { PublicStackParamList } from "@/routes/types";
import { colors } from "@/theme/colors";
import PasswordService from "@/services/PasswordService";
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<PublicStackParamList, "RecoverByEmail">;

export function RecoverByEmailScreen({ navigation }: Props): JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendCode = async (): Promise<void> => {
    if (!email.trim()) {
      Alert.alert(
        t("recoverByEmailScreen.requiredFieldTitle"),
        t("recoverByEmailScreen.requiredFieldMessage"),
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await PasswordService.sendRecoveryCode(email.trim());
      Alert.alert(t("recoverByEmailScreen.codeSentTitle"));
      navigation.navigate("OtpValidation", { email: email.trim() });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("recoverByEmailScreen.sendCodeError");
      Alert.alert(t("recoverByEmailScreen.sendFailedTitle"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer removeSafeArea padding={24}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("recoverByEmailScreen.title")}</Text>
        <Text style={styles.subtitle}>
          {t("recoverByEmailScreen.subtitle")}
        </Text>
      </View>
      <BinottoInput
        label={t("recoverByEmailScreen.emailLabel")}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder={t("recoverByEmailScreen.emailPlaceholder")}
      />
      <PrimaryButton
        title={
          isSubmitting
            ? t("recoverByEmailScreen.sending")
            : t("recoverByEmailScreen.sendCode")
        }
        onPress={handleSendCode}
        disabled={isSubmitting}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14,
  },
});
