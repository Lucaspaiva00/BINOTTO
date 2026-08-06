import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InternationalPhoneInput } from "@/components/common/InternationalPhoneInput";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { PublicStackParamList } from "@/routes/types";
import { colors } from "@/theme/colors";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import AuthService from "@/services/AuthService";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<
  PublicStackParamList,
  "CompleteRegistration"
>;

export function CompleteRegistrationScreen({
  navigation,
  route,
}: Props): JSX.Element {
  const { authenticatedWithoutSignIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [countryIso, setCountryIso] = useState("BR");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [secondaryCountryCode, setSecondaryCountryCode] = useState("+55");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>("");
  const [loading, setLoading] = useState(false);

  const workshopName = route.params?.workshopName ?? "";
  const userId = route.params?.userId ?? "";
  const verifiedPhone = route.params?.phone ?? "+39 000 000 0000";

  async function handleCompleteRegistration() {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.completeRegistrationAndLogin({
        usuario_id: 3,
        nome: name,
        apelido: nickname || null,
        email,
        senha: password,
        senha_confirmacao: confirmPassword,
        codigo_pais_telefone: countryCode,
        numero_telefone: phone,
        codigo_pais_telefone_secundario: secondaryCountryCode,
        telefone_secundario: secondaryPhone,
      });

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

          <View style={styles.verifiedCard}>
            <View style={styles.verifiedIcon}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.verifiedCopy}>
              <Text style={styles.verifiedLabel}>
                {t("completeRegistrationScreen.verifiedLabel")}
              </Text>
              <Text style={styles.verifiedValue}>{verifiedPhone}</Text>
            </View>
          </View>

          {error && (
            <ErrorAlert message={error} onClose={() => setError(null)} />
          )}

          <View style={styles.formCard}>
            <FieldLabel label={t("completeRegistrationScreen.fullNameLabel")} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("completeRegistrationScreen.fullNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <FieldLabel label={t("completeRegistrationScreen.nicknameLabel")} />
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder={t("completeRegistrationScreen.nicknamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

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

            <View style={styles.fieldHeader}>
              <FieldLabel
                label={t("completeRegistrationScreen.whatsappLabel")}
              />

              {!showSecondaryPhone && (
                <Pressable
                  onPress={() => setShowSecondaryPhone(true)}
                  style={({ pressed }) => [
                    styles.inlineAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.inlineActionText}>
                    {t("completeRegistrationScreen.addPhone")}
                  </Text>
                </Pressable>
              )}
            </View>

            <InternationalPhoneInput
              value={phone}
              onChange={({ phone, countryCode, countryIso }) => {
                setPhone(phone);
                setCountryCode(countryCode);
                setCountryIso(countryIso);
              }}
              inputWrapperStyle={{
                backgroundColor: colors.background,
                borderColor: colors.border,
              }}
              countryBoxStyle={{
                borderRightColor: colors.border,
              }}
            />

            {showSecondaryPhone && (
              <>
                <View style={styles.fieldHeader}>
                  <FieldLabel
                    label={t("completeRegistrationScreen.phoneLabel")}
                  />

                  <Pressable
                    onPress={() => {
                      setShowSecondaryPhone(false);
                      setPhone("");
                    }}
                    hitSlop={10}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>

                <InternationalPhoneInput
                  value={secondaryPhone}
                  onChange={({ phone, countryCode }) => {
                    setSecondaryPhone(phone);
                    setSecondaryCountryCode(countryCode);
                  }}
                  inputWrapperStyle={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }}
                  countryBoxStyle={{
                    borderRightColor: colors.border,
                  }}
                />
              </>
            )}

            <FieldLabel
              label={t("completeRegistrationScreen.createPasswordLabel")}
            />
            <View style={styles.passwordWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t(
                  "completeRegistrationScreen.passwordPlaceholder",
                )}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
              />

              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            <View style={styles.passwordWrap}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t(
                  "completeRegistrationScreen.confirmPasswordPlaceholder",
                )}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                style={[styles.input, styles.passwordInput]}
              />

              <Pressable
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.eyeButton}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            <View style={styles.submitWrap}>
              <PrimaryButton
                title={
                  loading
                    ? t("completeRegistrationScreen.finishing")
                    : t("completeRegistrationScreen.submit")
                }
                onPress={handleCompleteRegistration}
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

  verifiedCard: {
    backgroundColor: colors.backgroundSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#5f5110",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  verifiedIcon: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#2a2110",
    alignItems: "center",
    justifyContent: "center",
  },

  verifiedCopy: {
    flex: 1,
    gap: 4,
  },

  verifiedLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },

  verifiedValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
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

  passwordWrap: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: 48,
  },

  eyeButton: {
    position: "absolute",
    right: 16,
    top: 18,
  },

  submitWrap: {
    marginTop: 8,
  },

  pressed: {
    opacity: 0.75,
  },
});
