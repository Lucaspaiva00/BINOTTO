import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { colors } from "@/theme/colors";
import { SuccessAlert } from "@/components/common/SuccessAlert";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { DocumentItem, DocumentType } from "@/types/documents";

type Props = {
  documents: DocumentItem[];
  onAddDocument: (type: DocumentType) => void;
  onRemoveDocument: (id: string) => void;
  loading?: boolean;
  savingLoading: boolean;
  savingDocumentType: DocumentType | null;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  success: string | null;
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>;
};

const sections = [
  {
    key: "identidade" as DocumentType,
    titleKey: "identity",
    limit: 2,
  },
  {
    key: "passaporte" as DocumentType,
    titleKey: "passport",
    limit: 2,
  },
  {
    key: "doc_empresa" as DocumentType,
    titleKey: "companyDocument",
    limit: 5,
  },
  {
    key: "doc_ext" as DocumentType,
    titleKey: "extraDocuments",
    limit: 5,
  },
];

export default function DocumentsTab({
  documents,
  onAddDocument,
  onRemoveDocument,
  loading,
  savingLoading,
  savingDocumentType,
  error,
  setError,
  success,
  setSuccess,
}: Props) {
  const { t } = useTranslation();

  const handlePreview = (doc: DocumentItem) => {
    Linking.openURL(doc.uri).catch(() =>
      Alert.alert(
        t("technicianSettingsScreen.documents.previewErrorTitle"),
        t("technicianSettingsScreen.documents.previewErrorMessage")
      )
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {error && (
        <View style={{ marginBottom: 16 }}>
          <ErrorAlert
            message={error}
            onClose={() => setError(null)}
          />
        </View>
      )}

      {success && (
        <View style={{ marginBottom: 16 }}>
          <SuccessAlert
            message={success}
            onClose={() => setSuccess(null)}
          />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section) => {
          const docs = documents.filter(
            (d) => d.type === section.key
          );

          const canUpload = docs.length < section.limit;
          const isUploading = savingLoading && savingDocumentType === section.key;

          return (
            <View key={section.key} style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t(`technicianSettingsScreen.documents.${section.titleKey}`)}
                </Text>

                <Text style={styles.counter}>
                  {docs.length}/{section.limit}
                </Text>
              </View>

              {docs.length === 0 && (
                <Text style={styles.emptyText}>
                  {t("technicianSettingsScreen.documents.noDocuments")}
                </Text>
              )}

              <View style={styles.documentsList}>
                {docs.map((document) => (
                  <Pressable
                    key={document.id}
                    style={styles.documentCard}
                    onPress={() => handlePreview(document)}
                  >
                    <View style={styles.documentLeft}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={20}
                        color={colors.textMuted}
                      />

                      <Text
                        style={styles.documentName}
                        numberOfLines={1}
                      >
                        {document.name}
                      </Text>
                    </View>

                    <Pressable
                      hitSlop={10}
                      onPress={() =>
                        onRemoveDocument(document.id)
                      }
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </Pressable>
                ))}
              </View>

              <Pressable
                disabled={!canUpload || savingLoading}
                style={[
                  styles.dashedButton,
                  (!canUpload || savingLoading) &&
                    styles.buttonDisabled,
                ]}
                onPress={() =>
                  onAddDocument(section.key)
                }
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={colors.textMuted}
                />

                <Text style={styles.dashedButtonText}>
                  {isUploading
                    ? t("technicianSettingsScreen.documents.adding")
                    : canUpload
                      ? t("technicianSettingsScreen.documents.addType", {
                          type: t(
                            `technicianSettingsScreen.documents.${section.titleKey}`
                          ),
                        })
                      : t("technicianSettingsScreen.documents.limitReached")}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  counter: {
    color: colors.textMuted,
    fontWeight: "600",
  },

  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },

  documentsList: {
    gap: 10,
  },

  documentCard: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.backgroundBase,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  documentLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  documentName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },

  dashedButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.backgroundBase,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  dashedButtonText: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 14,
  },

  buttonDisabled: {
    opacity: 0.7,
  },
});