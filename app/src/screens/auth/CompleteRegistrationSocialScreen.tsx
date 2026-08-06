import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { PrimaryButton } from "@/components/common/PrimaryButton";
import { PublicStackParamList } from "@/routes/types";
import { colors } from "@/theme/colors";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import AuthService from "@/services/AuthService";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { getPushToken } from "@/services/NotificationService";
import { useLanguage } from "@/contexts/LanguageContext";
import EmptyState from "@/components/common/EmptyState";

type Props = NativeStackScreenProps<
  PublicStackParamList,
  "CompleteRegistrationSocial"
>;

export function CompleteRegistrationSocialScreen({
  navigation,
  route,
}: Props): JSX.Element {
  const { authenticatedWithoutSignIn } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const user = route.params;

  const [userId, setUserId] = useState<number | null>(null)
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>("");
  const [loading, setLoading] = useState(false);

  const cleanTemp = (value?: string | null) => {
    if (!value || value === "_TEMP") return "";
    return value;
  };

  async function handleCompleteRegistrationSocial() {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        setError(t('completeRegistrationScreen.invalidUserError'));
        return;
      }

      const pushToken = await getPushToken();

      const payload =
        user?.perfil === "TECNICO"
          ? {
              usuario_id: userId,
              perfil: "TECNICO",
              nome_completo: name,
              email: email || null,
              push_token: pushToken,
              plataforma: Platform.OS,
              idioma: locale
            }
          : {
              usuario_id: userId,
              perfil: "OFICINA",
              nome_fantasia: tradeName,
              nome_responsavel: responsibleName,
              email: email || null,
              push_token: pushToken,
              plataforma: Platform.OS,
              idioma: locale
            };

      const response =
        await AuthService.completeRegistrationSocialAndLogin(payload);

      authenticatedWithoutSignIn(response);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          t("completeRegistrationScreen.finishRegistrationError"),
      );
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setUserId(null);
        setName("");
        setTradeName("");
        setResponsibleName("");
        setEmail("");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      if (user.perfil === "TECNICO") {
        setName(cleanTemp(user.tecnico?.nome_completo));
        setTradeName("");
        setResponsibleName("");
      } else {
        setName("");
        setTradeName(cleanTemp(user.oficina?.nome_fantasia));
        setResponsibleName(cleanTemp(user.oficina?.nome_responsavel));
      }

      setError(null);
    }, [user])
  );

  if(!user){
    return (
      <EmptyState
        title={t("common.userNotFound")}
        buttonText={t("common.back")}
        onPress={() => navigation.navigate("Login")}
      />
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: 20 }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
            hitSlop={10}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={colors.white}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            {t("completeRegistrationScreen.headerTitle")}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>
              {t("completeRegistrationScreen.heroTitle")}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t("completeRegistrationScreen.heroSubtitle")}
            </Text>
          </View>

          {error && (
            <ErrorAlert message={error} onClose={() => setError(null)} />
          )}

          <View style={styles.formCard}>
            {user?.perfil === "TECNICO" ? (
              <>
                <FieldLabel label={t("completeRegistrationScreen.fullNameLabel")} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t("completeRegistrationScreen.fullNamePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </>
            ) : (
              <>
                <FieldLabel label={t("completeRegistrationScreen.tradeNameLabel")} />
                <TextInput
                  value={tradeName}
                  onChangeText={setTradeName}
                  placeholder={t("completeRegistrationScreen.tradeNamePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />

                <FieldLabel
                  label={t("completeRegistrationScreen.responsibleNameLabel")}
                />
                <TextInput
                  value={responsibleName}
                  onChangeText={setResponsibleName}
                  placeholder={t(
                    "completeRegistrationScreen.responsibleNamePlaceholder"
                  )}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </>
            )}

            <FieldLabel label={t("completeRegistrationScreen.emailLabel")} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t("completeRegistrationScreen.emailPlaceholder")}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <View style={styles.submitWrap}>
              <PrimaryButton
                title={
                  loading
                    ? t("completeRegistrationScreen.finishing")
                    : t("completeRegistrationScreen.submit")
                }
                onPress={handleCompleteRegistrationSocial}
                disabled={loading}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ label }: { label: string }): JSX.Element {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSurface,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 16,
  },

  heroCard: {
    backgroundColor: colors.backgroundSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 18,
    gap: 8,
  },

  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
  },

  heroSubtitle: {
    color: colors.textMuted,
    lineHeight: 20,
  },

  formCard: {
    backgroundColor: colors.backgroundSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    padding: 18,
    gap: 10,
  },

  fieldLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  fieldHeader: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  inlineActionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },

  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
  },

  submitWrap: {
    marginTop: 8,
  },

  pressed: {
    opacity: 0.75,
  },
});
