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
import WorkshopProfileService from "@/services/WorkshopProfileService";
import SettingsMenuTab from "./components/SettingsMenuTab";
import ProfileTab from "./components/ProfileTab";
import PasswordTab from "./components/PasswordTab";
import DocumentsTab from "./components/DocumentsTab";
import SupportTab from "./components/SupportTab";
import { WorkshopProfileForm } from "@/types/workshop";
import LanguageTab from "./components/LanguageTab";
import { PasswordForm, PasswordRequirement } from "@/types/password";
import PasswordService from "@/services/PasswordService";
import { DocumentItem, DocumentType } from "@/types/documents";
import * as DocumentPicker from "expo-document-picker";
import WorkshopDocumentsService from "@/services/WorkshopDocumentsService";
import { GLOBAL } from "@/constants/global";
import { useTranslation } from "react-i18next";
import DeleteAccountModal from "@/components/common/DeleteAccountModal";
import AuthService from "@/services/AuthService";
import { optimizeImage } from "@/utils/images";
import DocumentSourceModal from "@/components/common/DocumentSourceModal";
import EmailService from "@/services/EmailService";
import ConfirmModal from "@/components/common/ConfirmModal";

export type ViewType =
  | "menu"
  | "profile"
  | "password"
  | "support"
  | "documents"
  | "language";

const storage = GLOBAL.storage;

export default function WorkshopSettingsScreen({ navigation }: any) {
  const { authData, setAuthData, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // forms
  const [profile, setProfile] = useState<WorkshopProfileForm>({
    tradeName: authData?.name || "",
    companyName: "",
    responsible: "",
    email: authData?.email || "",
    email2: "",
    primaryPhone: authData?.phoneNumber || "",
    primaryPhoneCountryCode: authData?.countryCode || "",
    primaryPhoneCountryIso: authData?.countryIso || "",
    secondaryPhone: "",
    secondaryPhoneCountryCode: "",
    secondaryPhoneCountryIso: "",
    cnpj: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    paymentTerms: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [view, setView] = useState<ViewType>("menu");
  const [title, setTitle] = useState(t("workshopSettingsScreen.title"));
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
      menu: t("workshopSettingsScreen.title"),
      language: t("workshopSettingsScreen.menu.language"),
      profile: t("workshopSettingsScreen.menu.profile"),
      documents: t("workshopSettingsScreen.menu.documents"),
      support: t("workshopSettingsScreen.menu.support"),
      password: t("workshopSettingsScreen.menu.password"),
    };

    return mapTitle[currentView];
  };

  // constants
  const passwordRequirements: PasswordRequirement[] = [
    {
      label: t("workshopSettingsScreen.password.requirements.minLength"),
      met: passwordForm.newPassword.length >= 8,
    },
    {
      label: t("workshopSettingsScreen.password.requirements.uppercase"),
      met: /[A-Z]/.test(passwordForm.newPassword),
    },
    {
      label: t("workshopSettingsScreen.password.requirements.number"),
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
        tradeName: authData?.name || "",
        companyName: "",
        responsible: "",
        email: authData?.email || "",
        email2: "",
        primaryPhone: authData?.phoneNumber || "",
        primaryPhoneCountryCode: authData?.countryCode || "",
        primaryPhoneCountryIso: authData?.countryIso || "",
        secondaryPhone: "",
        secondaryPhoneCountryCode: "",
        secondaryPhoneCountryIso: "",
        cnpj: "",
        street: "",
        number: "",
        complement: "",
        city: "",
        state: "",
        zip: "",
        country: "",
        paymentTerms: "",
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

      await WorkshopDocumentsService.uploadDocument(file, type);

      setSuccess(
          t("workshopSettingsScreen.documents.documentSaved")
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
            t("workshopSettingsScreen.validationError")
          );

          return;
        }
      }

      setError(
        data?.message ??
        data?.error ??
        t(
          "workshopSettingsScreen.documents.saveDocumentError"
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
      await WorkshopDocumentsService.deleteDocument(id);

      setSuccess(t("workshopSettingsScreen.documents.documentRemoved"));

      await loadDocuments();
    } catch (error) {
      setError(t("workshopSettingsScreen.documents.removeDocumentError"));
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);

      const response = await WorkshopDocumentsService.getDocuments();
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
      setError(t("workshopSettingsScreen.documents.loadDocumentsError"));
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
        setError(t("workshopSettingsScreen.password.fillAllFields"));
        return;
      }

      if (newPassword !== confirmPassword) {
        setError(t("workshopSettingsScreen.password.passwordMismatch"));
        return;
      }

      const isValid = passwordRequirements.every((item) => item.met);

      if (!isValid) {
        setError(t("workshopSettingsScreen.password.invalidRequirements"));
        return;
      }

      setChangingPassword(true);

      await PasswordService.changePassword({
        senha_atual: currentPassword,
        nova_senha: newPassword,
        nova_senha_confirmacao: confirmPassword,
      });

      setSuccess(t("workshopSettingsScreen.password.passwordChanged"));

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
        t("workshopSettingsScreen.password.changePasswordError");

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
        t("workshopSettingsScreen.deleteAccount.error");
      Alert.alert(
        t("workshopSettingsScreen.deleteAccount.errorTitle"),
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

      const requiredAddressFields = [
        profile.street,
        profile.number,
        profile.city,
        profile.state,
        profile.zip,
        profile.country,
      ];

      const hasEmptyAddressField = requiredAddressFields.some(
        (field) => !field?.trim(),
      );

      if (hasEmptyAddressField) {
        setError(t("workshopSettingsScreen.profile.addressRequired"));
        return;
      }

      setSavingProfile(true);

      const payload = {
        nome_fantasia: profile.tradeName,
        razao_social: profile.companyName,
        nome_responsavel: profile.responsible,
        email: profile.email,
        email_secundario: profile.email2,
        numero_telefone: profile.primaryPhone,
        codigo_pais_telefone: profile.primaryPhoneCountryCode,
        iso_pais_telefone: profile.primaryPhoneCountryIso,
        telefone_secundario: profile.secondaryPhone,
        codigo_pais_telefone_secundario: profile.secondaryPhoneCountryCode,
        iso_pais_telefone_secundario: profile.secondaryPhoneCountryIso,
        cnpj: profile.cnpj,
        numero: profile.number,
        rua: profile.street,
        complemento: profile.complement,
        cidade: profile.city,
        estado: profile.state,
        cep: profile.zip,
        pais: profile.country,
        prazo_pagamento: profile.paymentTerms,
      };

      const response = await WorkshopProfileService.updateProfile(payload);
      const updatedProfile = response.data;

      // atualiza contexto
      setAuthData?.((prev: any) => ({
        ...prev,
        name: updatedProfile.nome,
        email: updatedProfile.email,
        countryCode: updatedProfile.codigo_pais_telefone,
        countryIso: updatedProfile.iso_pais_telefone,
        phoneNumber: updatedProfile.numero_telefone,
        canRequestTechnician: updatedProfile.podeSolicitarTecnico,
      }));

      setSuccess(t("workshopSettingsScreen.profile.profileUpdated"));
      
      setView("menu");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("workshopSettingsScreen.profile.updateProfileError");

      setError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);

      const response = await WorkshopProfileService.getProfile();

      const oficina = response?.data?.oficina;

      setProfile({
        tradeName: oficina?.nome_fantasia || "",
        companyName: oficina?.razao_social || "",
        responsible: oficina?.nome_responsavel || "",
        email: response?.data?.email || "",
        email2: oficina?.email_secundario || "",
        primaryPhone: response?.data?.numero_telefone || "",
        primaryPhoneCountryCode: response?.data?.codigo_pais_telefone || "",
        primaryPhoneCountryIso: response?.data?.iso_pais_telefone || "",
        secondaryPhone: oficina?.telefone_secundario || "",
        secondaryPhoneCountryCode: oficina?.codigo_pais_telefone_secundario || "",
        secondaryPhoneCountryIso: oficina?.iso_pais_telefone_secundario || "",
        cnpj: oficina?.cnpj || "",
        street: oficina?.rua || "",
        number: oficina?.numero || "",
        complement: oficina?.complemento || "",
        city: oficina?.cidade || "",
        state: oficina?.estado || "",
        zip: oficina?.cep || "",
        country: oficina?.pais || "",
        paymentTerms: oficina?.prazo_pagamento || "",
      });
    } catch (error) {
      setError(t("workshopSettingsScreen.profile.loadProfileError"));
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
                  t("workshopSettingsScreen.titleComingSoon"),
                  t("workshopSettingsScreen.comingSoon"),
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
        i18nRootKey="workshopSettingsScreen.deleteAccount"
        onClose={() => setDeleteAccountVisible(false)}
        onConfirm={handleDeleteAccount}
      />

      <DocumentSourceModal
        visible={documentModalVisible}
        title={t("workshopSettingsScreen.documents.sourceTitle")}
        subtitle={t("workshopSettingsScreen.documents.sourceSubtitle")}
        onClose={() => setDocumentModalVisible(false)}
        options={[
          {
            key: "camera",
            title: t("workshopSettingsScreen.documents.cameraTitle"),
            subtitle: t("workshopSettingsScreen.documents.cameraSubtitle"),
            icon: "camera-outline",
            onPress: handlePickDocumentCamera,
          },
          {
            key: "document",
            title: t("workshopSettingsScreen.documents.fileTitle"),
            subtitle: t("workshopSettingsScreen.documents.fileSubtitle"),
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
