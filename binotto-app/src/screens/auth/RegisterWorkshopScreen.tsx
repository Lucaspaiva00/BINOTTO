import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";
import UserService from "@/services/UserService";
import { useNavigation } from "@react-navigation/native";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import AppHeader from "@/components/common/AppHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useTranslation } from "react-i18next";
import { InternationalPhoneInput } from "@/components/common/InternationalPhoneInput";
import { GoogleIcon } from "@/components/icons/google.icons";
import { FacebookIcon } from "@/components/icons/facebook.icons";
import { AppleIcon } from "@/components/icons/apple.icons";
import AuthService from "@/services/AuthService";
import { useLanguage } from "@/contexts/LanguageContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from 'expo-apple-authentication';
// import { AccessToken, LoginManager } from "react-native-fbsdk-next";

const languages = [
  { key: "it", code: "IT", label: "Italiano", flag: "🇮🇹" },
  { key: "fr", code: "FR", label: "Français", flag: "🇫🇷" },
  { key: "pt-BR", code: "BR", label: "Português", flag: "🇧🇷" },
  // { key: "en", code: "EN", label: "English" },
] as const;

export function RegisterWorkshopScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // states
  const [tradeName, setTradeName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [countryIso, setCountryIso] = useState("BR");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { locale, language, setLanguage } = useLanguage();

  // utils
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successData, setSuccessData] = useState({
    title: "",
    subtitle: "",
  });
  const [loading, setLoading] = useState(false);
  const [isRegisteringSocial, setIsRegisteringSocial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // handlers
  const handleSubmit = async () => {
    try {
      setError(null);

      if (!tradeName || !email || !phone || !password || !confirmPassword) {
        setError(t("registerWorkshopScreen.requiredFieldsError"));
        return;
      }

      if (password !== confirmPassword) {
        setError(t("registerWorkshopScreen.passwordMismatchError"));
        return;
      }

      setLoading(true);

      const payload = {
        nome_fantasia: tradeName.trim(),
        nome_responsavel: ownerName.trim() || null,
        email: email.trim(),
        codigo_pais_telefone: countryCode,
        numero_telefone: phone.trim(),
        iso_pais_telefone: countryIso,
        senha: password,
        confirmar_senha: confirmPassword,
      };

      const response = await UserService.registerOficina(payload);

      setSuccessData({
        title: t("registerWorkshopScreen.successTitle"),
        subtitle: response.message,
      });
      setSuccessModalVisible(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("registerWorkshopScreen.createAccountError");

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (type: 'google' | 'apple' | 'facebook') => {
    try {
      setError(null);
      setIsRegisteringSocial(true);

      let payload = null;

      switch (type) {
        //  case 'facebook': {
        //   const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

        //   if (result.isCancelled) {
        //     return; 
        //   }

        //  const dataToken = await AccessToken.getCurrentAccessToken();

        //   if (!dataToken) {
        //      return; 
        //   }

        //   payload = {
        //     id: dataToken.userID,
        //     idToken: dataToken.accessToken,
        //     nome: null,
        //     email: null,
        //     tipo: 'facebook',
        //       perfil: 'OFICINA',
        //   };

        //   break;
        // }
        case 'google': {
          const { data } = await GoogleSignin.signIn();

          if (!data) {
            return;
          }

          payload = {
            id: data.user?.id,
            idToken: data.idToken,
            nome: data.user?.name ?? null,
            email: data.user?.email ?? null,
            tipo: 'google',
            perfil: 'OFICINA',
          };

          break;
        }

        case 'apple': {
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          if (!credential.user) {
            return;
          }

          payload = {
             idToken:credential.identityToken,
            id: credential.user,
            tipo: 'apple',
            perfil: 'OFICINA',
          };

          break;
        }

        default:
          setError(t('common.errorSocialRegister'));
          return;
      }

      const response = await UserService.registerSocial(payload);
      navigation.navigate("CompleteRegistrationSocial", response.user)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        t('common.errorSocialRegister');

      setError(message);
    } finally {
      setIsRegisteringSocial(false);
    }
  };

  const toggleLanguageModal = () => {
    if (languageModalVisible) {
      setLanguageModalVisible(false);
    } else {
      setLanguageModalVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={{
          flex: 1,
          paddingTop: 0,
          backgroundColor: colors.background,
        }}
      >
        {/* HEADER */}
        <AppHeader
          logo={require("@/assets/binotto-dog-logo-cropped.png")}
          title={t("registerWorkshopScreen.headerTitle")}
          subtitle={t("registerWorkshopScreen.headerSubtitle")}
          onBack={() => navigation.goBack()}
          showLenguageButton={(
            <View style={styles.langWrapper}>
              <Pressable style={styles.langBadge} onPress={toggleLanguageModal}>
                <MaterialCommunityIcons name="web" size={20} color="#fff" />
                <Text style={styles.langText}>
                  {languages.find((l) => l.key === language)?.code}
                </Text>
              </Pressable>

              {languageModalVisible && (
                <View style={styles.dropdown}>
                  {languages.map((item) => {
                    const selected = language === item.key;

                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => {
                          setLanguage(item.key);
                          setLanguageModalVisible(false);
                        }}
                        style={[styles.item, selected && styles.itemActive]}
                      >
                        <Text
                          style={[styles.code, selected && styles.codeActive]}
                        >
                          {item.code}
                        </Text>
                        <Text
                          style={[styles.label, selected && styles.labelActive]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        />

        <ScrollView contentContainerStyle={styles.content}>
          {/* ERROR */}
          {error && (
            <ErrorAlert message={error} onClose={() => setError(null)} />
          )}

          {/* INPUTS */}
          <View style={styles.section}>
            <TextInput
              style={styles.input}
              value={tradeName}
              onChangeText={setTradeName}
              placeholder={t("registerWorkshopScreen.tradeNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.section}>
            <TextInput
              style={styles.input}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder={t("registerWorkshopScreen.ownerNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.section}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder={t("registerWorkshopScreen.emailPlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* WHATSAPP */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {t("registerWorkshopScreen.whatsappLabel")} *
            </Text>

            <View style={styles.phoneRow}>
              <InternationalPhoneInput
                value={phone}
                onChange={({ phone, countryCode, countryIso }) => {
                  setPhone(phone);
                  setCountryCode(countryCode);
                  setCountryIso(countryIso);
                }}
              />
            </View>
          </View>

          {/* PASSWORD */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {t("registerWorkshopScreen.createPasswordLabel")}
            </Text>

            <View style={styles.passwordBox}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder={t("registerWorkshopScreen.passwordPlaceholder")}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />

              <Pressable
                style={styles.eye}
                onPress={() => setShowPassword((p) => !p)}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.passwordBox}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t(
                  "registerWorkshopScreen.confirmPasswordPlaceholder",
                )}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />

              <Pressable
                style={styles.eye}
                onPress={() => setShowConfirmPassword((p) => !p)}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            {/* SOCIAL LOGIN */}
            <View style={styles.actionsRow}>
              <View style={styles.socialRow}>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity 
                    onPress={() => handleSocialRegister('apple')} 
                    style={{height:45}}
                    disabled={isRegisteringSocial} 
                  >
                    <AppleIcon size={28} />
                  </TouchableOpacity>
                )}
            
                <TouchableOpacity
                  style={{height:40}} 
                  onPress={() => handleSocialRegister('google')}
                  disabled={isRegisteringSocial}
                >
                  <GoogleIcon  />
                </TouchableOpacity>
                              
                <TouchableOpacity
                  style={{height:40}}
                  onPress={() => handleSocialRegister('facebook')}
                  disabled={isRegisteringSocial}
                >
                  <FacebookIcon />
                </TouchableOpacity>
              </View>
            </View>

            {/* PRIMARY CTA */}
            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading || isRegisteringSocial}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.black} />
                  <Text style={styles.buttonText}>
                    {t("registerWorkshopScreen.creating")}
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {t("registerWorkshopScreen.createAccount")}
                </Text>
              )}
            </Pressable>

            {/* TERMS */}
            <Text style={styles.termsText}>
              {t("registerWorkshopScreen.termsPrefix")}
              <Text style={styles.termsLink}>
                {t("registerWorkshopScreen.termsOfUse")}
              </Text>
              {t("registerWorkshopScreen.termsAnd")}
              <Text style={styles.termsLink}>
                {t("registerWorkshopScreen.privacyPolicy")}
              </Text>
            </Text>
          </View>
        </ScrollView>

        <ConfirmModal
          visible={successModalVisible}
          type="success"
          title={successData.title}
          subtitle={successData.subtitle}
          variant="single"
          confirmText={t("registerWorkshopScreen.goToLogin")}
          onConfirm={() => navigation.navigate("Login")}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },

  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  content: {
    padding: 16,
    gap: 16,
  },

  section: {
    gap: 6,
  },

  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },

  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSurface,
    paddingHorizontal: 14,
    color: colors.text,
  },

  phoneRow: {
    flex: 1,
  },

  phonePrefix: {
    width: 60,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSurface,
  },

  phonePrefixText: {
    color: colors.text,
    fontWeight: "600",
  },

  phoneInput: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSurface,
    paddingHorizontal: 14,
    color: colors.text,
  },

  passwordBox: {
    position: "relative",
  },

  eye: {
    position: "absolute",
    right: 14,
    top: 16,
  },

  error: {
    color: "#ef4444",
    fontSize: 12,
  },

  actionsContainer: {
    marginTop: 16,
    gap: 14,
  },


actionsRow: {
  width: "100%",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
},

socialRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 24,
},

  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  socialText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 13,
  },

  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontWeight: "800",
    color: colors.black,
    fontSize: 15,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  termsText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 10,
  },

  termsLink: {
    color: colors.white,
    fontWeight: "600",
  },

  required: {
    color: colors.danger,
    fontWeight: "700",
  },

  langWrapper: {
    position: "relative",
  },

  langBadge: {
    paddingHorizontal: 11,
    marginBottom: 16,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#6c5e1700",
    backgroundColor: "#938423",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },

  langText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  dropdown: {
    position: "absolute",
    top: 48,
    right: 0,
    width: 190,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    padding: 8,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderRadius: 8,
  },

  itemActive: {
    backgroundColor: "#2B2B2B",
  },

  code: {
    color: colors.textMuted,
    fontSize: 14,
    width: 28,
  },

  codeActive: {
    color: "#FFFFFF",
  },

  labelActive: {
    color: "#FFFFFF",
  },
});
