import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

import AppHeader from "@/components/common/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/theme/colors";
import SettingsMenuTab from "../tech/components/SettingsMenuTab";
import ProfileTab from "../tech/components/ProfileTab";
import PasswordTab from "../tech/components/PasswordTab";
import DocumentsTab from "../tech/components/DocumentsTab";
import SupportTab from "../tech/components/SupportTab";
import LanguageTab from "../tech/components/LanguageTab";
import { PasswordForm, PasswordRequirement } from "@/types/password";
import PasswordService from "@/services/PasswordService";
import { DocumentItem, DocumentType } from "@/types/documents";
import * as DocumentPicker from "expo-document-picker";
import TechnicianDocumentsService from "@/services/TechnicianDocumentsService";
import { GLOBAL } from "@/constants/global";
import { useTranslation } from "react-i18next";
import DeleteAccountModal from "@/components/common/DeleteAccountModal";
import AuthService from "@/services/AuthService";
import TechnicianProfileService from "@/services/TechnicianProfileService";
import { TechnicianProfileForm } from "@/types/technician";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmailService from "@/services/EmailService";
import DocumentSourceModal from "@/components/common/DocumentSourceModal";
import { optimizeImage } from "@/utils/images";

export type ViewType =
  | "menu"
  | "profile"
  | "password"
  | "support"
  | "documents"
  | "language";

const storage = GLOBAL.storage;

export default function TechnicianSettingsScreen({ navigation }: any) {
  const { authData, setAuthData, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // forms
  const [profile, setProfile] = useState<TechnicianProfileForm>({
    fullName: "",
    nickname: "",
    email: authData?.email || "",
    primaryPhoneCountryIso: authData?.countryIso|| "",
    primaryPhoneCountryCode: authData?.countryCode || "",
    primaryPhone: authData?.phoneNumber || "",
    secondaryPhoneCountryIso: "",
    secondaryPhoneCountryCode: "",
    secondaryPhone: "",
    birthDate: "",
    nationality: "",
    secondNationality: "",
    cpf: "",
    cnpj: "",
    companyFantasyName: "",
    companyLegalName: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    workCountries: [],
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [view, setView] = useState<ViewType>("menu");
  const [title, setTitle] = useState(t("technicianSettingsScreen.title"));
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<DocumentType | null>(null);

  // utils
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [savingDocumentType, setSavingDocumentType] = useState<DocumentType | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const getViewTitle = (currentView: ViewType) => {
    const mapTitle: Record<ViewType, string> = {
      menu: t("technicianSettingsScreen.title"),
      language: t("technicianSettingsScreen.menu.language"),
      profile: t("technicianSettingsScreen.menu.profile"),
      documents: t("technicianSettingsScreen.menu.documents"),
      support: t("technicianSettingsScreen.menu.support"),
      password: t("technicianSettingsScreen.menu.password"),
    };

    return mapTitle[currentView];
  };

  // constants
  const passwordRequirements: PasswordRequirement[] = [
    {
      label: t("technicianSettingsScreen.password.requirements.minLength"),
      met: passwordForm.newPassword.length >= 8,
    },
    {
      label: t("technicianSettingsScreen.password.requirements.uppercase"),
      met: /[A-Z]/.test(passwordForm.newPassword),
    },
    {
      label: t("technicianSettingsScreen.password.requirements.number"),
      met: /\d/.test(passwordForm.newPassword),
    },
  ];

  const goBack = () => {
    if (view === "menu") {
      navigation.goBack();
      return;
    }

    setTitle(getViewTitle("menu"));
    setView("menu");
  };

  const handleSelectMenu = (menu: ViewType) => {
    if (menu === "profile") {
      setProfile({
        fullName: authData?.name || "",
        nickname: "",
        email: authData?.email || "",
        primaryPhoneCountryIso: authData?.countryIso || "",
        primaryPhoneCountryCode: authData?.countryCode || "",
        primaryPhone: authData?.phoneNumber || "",
        secondaryPhoneCountryIso: "",
        secondaryPhoneCountryCode: "",
        secondaryPhone: "",
        birthDate: "",
        nationality: "",
        secondNationality: "",
        cpf: "",
        cnpj: "",
        companyFantasyName: "",
        companyLegalName: "",
        street: "",
        number: "",
        complement: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        workCountries: [],
      });
    }

    if (menu === "password") {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }

    setError(null);
    setSuccess(null);
    setTitle(getViewTitle(menu));
    setView(menu);
  };

  // requests
  const handleSendEmailSupport = async (subject: string, message: string): Promise<void> => {
    try{
      if (!subject.trim() || !message.trim()) {
        return;
      }
      
      setSuccess("");
      setError("");
      setSendingEmail(true);

      const payload = {
        subject,
        message
      }

      await EmailService.sendEmailSupport(payload);

      setView("menu");
    }catch(error: any){
      const data = error?.response?.data;

      const message = data?.message || data?.error ||
        t("common.error");

      setError(message);
    } finally {
      setSendingEmail(false);
    }
  }

  const handlePickDocumentGallery = async () => {
    if (!selectedDocumentType) return;

    setDocumentModalVisible(false);

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "image/jpeg",
        "image/png",
      ],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets[0];

    if (!file?.uri) {
      return;
    }

    await uploadDocument(file, selectedDocumentType);
  };

  const handlePickDocumentCamera = async () => {
    if (!selectedDocumentType) return;

    setDocumentModalVisible(false);

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const optimizedImage = await optimizeImage(result.assets[0]);

    await uploadDocument(optimizedImage, selectedDocumentType);
  };

  const uploadDocument = async (file: any, type: DocumentType) => {
    try {
      setSuccess("");
      setError("");
      setSavingDocument(true);
      setSavingDocumentType(selectedDocumentType);

      await TechnicianDocumentsService.uploadDocument(file, type);

      setSuccess(
          t("technicianSettingsScreen.documents.documentSaved")
      );

      await loadDocuments();
    } catch (error: any) {
      const data = error?.response?.data;

      if (error?.response?.status === 422) {
        const errors = data?.errors as Record<string, string[]>;

        if (errors) {
          const firstError = Object.values(errors)?.[0]?.[0];

          setError(
            firstError ??
            t("technicianSettingsScreen.validationError")
          );

          return;
        }
      }

      setError(
        data?.message ??
        data?.error ??
        t(
          "technicianSettingsScreen.documents.saveDocumentError"
        )
      );
    } finally {
      setSavingDocument(false);
      setSavingDocumentType(null);
    }
  };

  const handleRemoveDocument = async (id: string) => {
    try {
      setLoadingDocuments(true);
      await TechnicianDocumentsService.deleteDocument(id);

      setSuccess(t("technicianSettingsScreen.documents.documentRemoved"));

      await loadDocuments();
    } catch (error) {
      setError(t("technicianSettingsScreen.documents.removeDocumentError"));
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);

      const response = await TechnicianDocumentsService.getDocuments();
      const docs = response.documents || [];

      setDocuments(
        docs.map((doc: any) => ({
          id: String(doc.id),
          name: doc.nome,
          uri: `${storage}/${doc.url || doc.arquivo}`,
          type: doc.tipo
        })),
      );
    } catch (error) {
      setError(t("technicianSettingsScreen.documents.loadDocumentsError"));
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSuccess("");
      setError("");

      const { currentPassword, newPassword, confirmPassword } = passwordForm;

      if (!currentPassword || !newPassword || !confirmPassword) {
        setError(t("technicianSettingsScreen.password.fillAllFields"));
        return;
      }

      if (newPassword !== confirmPassword) {
        setError(t("technicianSettingsScreen.password.passwordMismatch"));
        return;
      }

      const isValid = passwordRequirements.every((item) => item.met);

      if (!isValid) {
        setError(t("technicianSettingsScreen.password.invalidRequirements"));
        return;
      }

      setChangingPassword(true);

      await PasswordService.changePassword({
        senha_atual: currentPassword,
        nova_senha: newPassword,
        nova_senha_confirmacao: confirmPassword,
      });

      setSuccess(t("technicianSettingsScreen.password.passwordChanged"));

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setView("menu");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianSettingsScreen.password.changePasswordError");

      setError(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleCancelLogout = () => {
    setLogoutModalVisible(false);
  };

  const handleConfirmLogout = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {}
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await AuthService.deleteAccount();
      setDeleteAccountVisible(false);
      await signOut();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianSettingsScreen.deleteAccount.error");
      Alert.alert(
        t("technicianSettingsScreen.deleteAccount.errorTitle"),
        message,
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSuccess("");
      setError("");
      setSavingProfile(true);

      const payload = {
        nome_completo: profile.fullName,
        apelido: profile.nickname,
        email: profile.email,
        codigo_pais_telefone: profile.primaryPhoneCountryCode,
        numero_telefone: profile.primaryPhone,
        iso_pais_telefone: profile.primaryPhoneCountryIso,
        codigo_pais_telefone_secundario: profile.secondaryPhoneCountryCode,
        telefone_secundario: profile.secondaryPhone,
        iso_pais_telefone_secundario: profile.secondaryPhoneCountryIso,
        data_nascimento: profile.birthDate,
        nacionalidade: profile.nationality,
        nacionalidade_secundaria: profile.secondNationality,
        cpf: profile.cpf,
        cnpj: profile.cnpj,
        nome_fantasia_empresa: profile.companyFantasyName,
        razao_social_empresa: profile.companyLegalName,
        endereco_rua: profile.street,
        endereco_numero: profile.number,
        endereco_complemento: profile.complement,
        endereco_cidade: profile.city,
        endereco_estado: profile.state,
        endereco_cep: profile.zipCode,
        pais_atual: profile.country,
        disponibilidade_geografica: profile.workCountries,
      };

      const response = await TechnicianProfileService.updateProfile(payload);
      const updatedProfile = response.data;

      // atualiza contexto
      setAuthData?.((prev: any) => ({
        ...prev,
        nome: updatedProfile.nome,
        email: updatedProfile.email,
        countryCode: updatedProfile.codigo_pais_telefone,
        countryIso: updatedProfile.iso_pais_telefone,
        phoneNumber: updatedProfile.numero_telefone,
      }));

      setSuccess(t("technicianSettingsScreen.profile.profileUpdated"));

      await loadProfile();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianSettingsScreen.profile.updateProfileError");

      setError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);

      const response = await TechnicianProfileService.getProfile();

      const tecnico = response?.data?.tecnico;

      setProfile({
        fullName: tecnico.nome_completo ?? "",
        nickname: tecnico.apelido ?? "",
        email: response?.data?.email ?? "",
        primaryPhoneCountryIso: response?.data?.iso_pais_telefone ?? "",
        primaryPhoneCountryCode: response?.data?.codigo_pais_telefone ?? "",
        primaryPhone: response?.data?.numero_telefone ?? "",
        secondaryPhoneCountryIso: 
          tecnico.iso_pais_telefone_secundario ?? "",
        secondaryPhoneCountryCode:
          tecnico.codigo_pais_telefone_secundario ?? "",
        secondaryPhone: tecnico.telefone_secundario ?? "",
        birthDate: tecnico.data_nascimento ?? "",
        nationality: tecnico.nacionalidade ?? "",
        secondNationality: tecnico.nacionalidade_secundaria ?? "",
        cpf: tecnico.cpf ?? "",
        cnpj: tecnico.cnpj ?? "",
        companyFantasyName: tecnico.nome_fantasia_empresa ?? "",
        companyLegalName: tecnico.razao_social_empresa ?? "",
        street: tecnico.endereco_rua ?? "",
        number: tecnico.endereco_numero ?? "",
        complement: tecnico.endereco_complemento ?? "",
        city: tecnico.endereco_cidade ?? "",
        state: tecnico.endereco_estado ?? "",
        zipCode: tecnico.endereco_cep ?? "",
        country: tecnico.pais_atual ?? "",
        workCountries: tecnico.disponibilidade_geografica ?? [],
      });
    } catch (error) {
      setError(t("technicianSettingsScreen.profile.loadProfileError"));
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (view === "profile") {
      loadProfile();
    }

    if (view === "documents") {
      loadDocuments();
    }

    setTitle(getViewTitle(view));
  }, [view, t]);

  useFocusEffect(
    useCallback(() => {
      setView("menu");
      setError(null);
      setSuccess(null);
    }, [])
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: 0 }]}>
        <AppHeader
          logo={require("@/assets/binotto-dog-logo-cropped.png")}
          title={title}
          onBack={goBack}
        />

        <ScrollView
          contentContainerStyle={[styles.content, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
        >
          {view === "menu" && (
            <SettingsMenuTab
              onSelectMenu={handleSelectMenu}
              onSignOut={handleOpenLogout}
              onDeleteAccount={() => setDeleteAccountVisible(true)}
            />
          )}

          {view === "language" && <LanguageTab />}

          {view === "profile" && (
            <ProfileTab
              profile={profile}
              setProfile={setProfile}
              onSave={handleSaveProfile}
              loading={loadingProfile}
              savingLoading={savingProfile}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
            />
          )}

          {view === "documents" && (
            <DocumentsTab
              documents={documents}
              onAddDocument={(type) => {
                setSelectedDocumentType(type);
                setDocumentModalVisible(true);
              }}
              onRemoveDocument={handleRemoveDocument}
              loading={loadingDocuments}
              savingLoading={savingDocument}
              savingDocumentType={savingDocumentType}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
            />
          )}

          {view === "support" && (
            <SupportTab 
              loading={sendingEmail} 
              onSendEmail={handleSendEmailSupport}
              error={error}
              setError={setError} 
            />
          )}

          {view === "password" && (
            <PasswordTab
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              passwordRequirements={passwordRequirements}
              changingLoading={changingPassword}
              onSubmit={handleChangePassword}
              onForgotPassword={() =>
                Alert.alert(
                  t("technicianSettingsScreen.titleComingSoon"),
                  t("technicianSettingsScreen.comingSoon"),
                )
              }
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
            />
          )}
        </ScrollView>
      </View>

      <ConfirmModal
        textAlign="left"
        visible={logoutModalVisible}
        title={t("common.logoutTitle")}
        subtitle={t("common.logoutSubtitle")}
        variant="double"
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />

      <DeleteAccountModal
        visible={deleteAccountVisible}
        loading={deletingAccount}
        i18nRootKey="technicianSettingsScreen.deleteAccount"
        onClose={() => setDeleteAccountVisible(false)}
        onConfirm={handleDeleteAccount}
      />

      <DocumentSourceModal
        visible={documentModalVisible}
        title={t("technicianSettingsScreen.documents.sourceTitle")}
        subtitle={t("technicianSettingsScreen.documents.sourceSubtitle")}
        onClose={() => setDocumentModalVisible(false)}
        options={[
          {
            key: "camera",
            title: t("technicianSettingsScreen.documents.cameraTitle"),
            subtitle: t("technicianSettingsScreen.documents.cameraSubtitle"),
            icon: "camera-outline",
            onPress: handlePickDocumentCamera,
          },
          {
            key: "document",
            title: t("technicianSettingsScreen.documents.fileTitle"),
            subtitle: t("technicianSettingsScreen.documents.fileSubtitle"),
            icon: "file-document-outline",
            onPress: handlePickDocumentGallery,
          },
        ]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },
});
