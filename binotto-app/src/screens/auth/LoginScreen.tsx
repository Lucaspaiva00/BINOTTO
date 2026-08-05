import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  Platform,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ScreenContainer } from "@/components/common/ScreenContainer";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { AuthContext, useAuth } from "@/contexts/AuthContext";
import { PublicStackParamList } from "@/routes/types";
import { AccountType } from "@/types/auth";
import { colors } from "@/theme/colors";
import { GLOBAL } from "@/constants/global";
import PermissionController from "@/controllers/permission.controller";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";

import {  Building2, Wrench } from "lucide-react-native";
import { FacebookIcon } from "@/components/icons/facebook.icons";
import { GoogleIcon } from "@/components/icons/google.icons";
import * as AppleAuthentication from 'expo-apple-authentication';
import { AppleIcon } from "@/components/icons/apple.icons";
import AuthService from "@/services/AuthService";
import { getPushToken } from "@/services/NotificationService";
// import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

type Props = NativeStackScreenProps<PublicStackParamList, "Login">;

const languages = [
  { key: "it", code: "IT", label: "Italiano", flag: "🇮🇹" },
  { key: "fr", code: "FR", label: "Français", flag: "🇫🇷" },
  { key: "pt-BR", code: "BR", label: "Português", flag: "🇧🇷" },
  // { key: "en", code: "EN", label: "English" },
] as const;

export function LoginScreen({ navigation }: Props): JSX.Element {
  const { signInSocial, signIn } = useAuth();
  const { locale, language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const [accountType, setAccountType] = useState<AccountType>("TECHNICIAN");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>("");
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleLoginSocial = async (type: 'google' | 'apple' | 'facebook') => {
     try {
      setError(null);

      let payload = null;

      const pushToken = await getPushToken();

      switch (type) {
      //   case 'facebook': {
      //   const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      //   if (result.isCancelled) {
      //     console.log("Login cancelado pelo usuário");
      //     return;
      //   }

      //   const dataToken = await AccessToken.getCurrentAccessToken();

      //   if (!dataToken) {
      //    return; 
      //   }

      //   payload = {
      //     tipo: 'facebook',
      //     id: dataToken.userID, 
      //     idioma: locale,
      //     push_token: pushToken,
      //     plataforma: Platform.OS,
      //     idToken: dataToken.accessToken 
      //   };

      //   break;
      // }
        case 'google': {

              const { data } = await GoogleSignin.signIn();

          if (!data) {
            return;
          }

          payload = {
            tipo: 'google',
            id: data.user?.id,
            idioma: locale,
            push_token: pushToken,
            plataforma: Platform.OS,
            idToken:data.idToken
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
            tipo: 'apple',
            id: credential.user,
            idioma: locale,
            push_token: pushToken,
            plataforma: Platform.OS,
             idToken:credential.identityToken
          };

          break;
        }

        default:
          setError(t('common.errorSocialLogin'));
          return;
      }

      const response = await signInSocial(payload);

      if (response.status === "PRE_REGISTRATION_SOCIAL") {
        navigation.navigate("CompleteRegistrationSocial", response.user);
        return;
      }
    } catch (error) {
      setError(t('common.errorSocialLogin'));
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!login.trim() || !password.trim()) {
      setError(t("loginScreen.fillAllFields"));
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await signIn(login.trim(), password, locale);

      // Pre Cadastro
      if (response.status === "PRE_REGISTRATION") {
        navigation.navigate("CompleteRegistration", {
          phone: response.user.whatsapp,
          workshopName: response.user.workshopName,
          userId: response.user.id,
        });
        return;
      }
    } catch (error) {
      const apiMessage =
        (error as any)?.response?.data?.error || t("loginScreen.loginFailed");

      setError(apiMessage);
    } finally {
      setIsSubmitting(false);
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
    <ScreenContainer padding={0}>
      <View style={{ marginBottom: 0 }}>
        <View style={styles.header}>
          <View style={styles.brandBar}>
            <Image
              source={require("@/assets/binotto-logo.png")}
              resizeMode="contain"
              style={styles.brandLogo}
            />

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
          </View>
        </View>
        <View style={styles.wrapper}>
          <Text allowFontScaling={false} style={styles.title}>
            {t("loginScreen.welcome")}
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            {t("loginScreen.subtitle")}
          </Text>

          {error && (
            <ErrorAlert message={error} onClose={() => setError(null)} />
          )}

          <Pressable
            style={[
              styles.roleButton,
              accountType === "TECHNICIAN" && styles.roleButtonActive,
            ]}
            onPress={() => {
              setAccountType("TECHNICIAN");
              navigation.navigate("RegisterTechnician");
            }}
          >
            <Wrench
              size={20}
              color={
                accountType === "TECHNICIAN"
                  ? colors.background
                  : colors.primary
              }
            />
            <Text
              allowFontScaling={false}
              style={[
                styles.roleButtonText,
                accountType === "TECHNICIAN" && styles.roleButtonTextActive,
              ]}
            >
              {t("loginScreen.technician")}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.roleButton,
              accountType === "WORKSHOP" && styles.roleButtonActive,
            ]}
            onPress={() => {
              setAccountType("WORKSHOP");
              navigation.navigate("RegisterWorkshop");
            }}
          >
            <Building2
              size={20}
              color={
                accountType === "WORKSHOP" ? colors.background : colors.primary
              }
            />
            <Text
              allowFontScaling={false}
              style={[
                styles.roleButtonText,
                accountType === "WORKSHOP" && styles.roleButtonTextActive,
              ]}
            >
              {t("loginScreen.workshop")}
            </Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text allowFontScaling={false} style={styles.dividerText}>
              {t("loginScreen.divider")}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <Text allowFontScaling={false} style={styles.inputLabel}>
            {t("loginScreen.signInWithAccount")}
          </Text>

          <TextInput
            style={styles.input}
            placeholder={t("loginScreen.emailOrWhatsapp")}
            placeholderTextColor={colors.textMuted}
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            keyboardType="default"
            autoCorrect={false}
          />

          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder={t("loginScreen.password")}
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry={!showPassword}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color="#8B8F99"
              />
            </Pressable>
          </View>

         <View style={styles.actionsRow}>
            <View style={styles.socialRow}>
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  onPress={() => handleLoginSocial('apple')} 
                  style={{height:45}}
                >
                  <AppleIcon  size={28}  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={{height:40}}
                onPress={() => handleLoginSocial('google')}
              >
                <GoogleIcon  />
              </TouchableOpacity>
                  
              <TouchableOpacity
                style={{height:40}}
                onPress={() => handleLoginSocial('facebook')}
              >
                <FacebookIcon />
              </TouchableOpacity>
            </View>
         
            <Pressable 
              onPress={() => navigation.navigate("RecoverPassword")}     
              style={{height:40}}
            >
              <Text allowFontScaling={false} style={styles.forgotText}>
                {t("loginScreen.forgotPassword")}
              </Text>
            </Pressable>
          </View>
          <PrimaryButton
            title={
              isSubmitting
                ? t("loginScreen.signingIn")
                : t("loginScreen.signIn")
            }
            onPress={handleLogin}
            disabled={isSubmitting}
          />

          <Pressable
            style={styles.privacyButton}
            onPress={() => {
              Linking.openURL(
                GLOBAL.baseURL.replaceAll("/api/mobile", "") +
                  "/politica-privacidade.html",
              );
            }}
          >
            <Text allowFontScaling={false} style={styles.forgotText}>
              {t("loginScreen.privacyPolicy")}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    padding: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  wrapper: {
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 14,
  },
  brandBar: {
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLogo: {
    width: 145,
    height: 70,
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
  privacyButton: {
    alignItems: "center",
    marginTop: 12,
  },
  title: {
    marginTop: 12,
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 28,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  roleButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#8b8137",
    backgroundColor: "#3e3a1a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: "#E0BF12",
  },
  roleButtonText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "700",
  },
  roleButtonTextActive: {
    color: colors.background,
  },
  dividerRow: {
    marginVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2C2F36",
  },
  dividerText: {
    color: "#717781",
    fontSize: 14,
  },
  inputLabel: {
    color: "#9BA0AA",
    fontSize: 13,
    marginBottom: 2,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 16,
  },
  actionsRow: {
    marginTop: 0,
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  socialRow: {
    flexDirection: "row", 
    alignItems: "center",
    height:50,
     justifyContent: "space-between",
    gap: 24,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },

  langWrapper: {
    position: "relative",
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

  label: {
    color: colors.textMuted,
  },

  codeActive: {
    color: "#FFFFFF",
  },

  labelActive: {
    color: "#FFFFFF",
  },
});
