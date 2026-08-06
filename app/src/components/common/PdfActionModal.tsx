import { SetStateAction } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
} from "react-native";
import { colors } from "@/theme/colors";
import { FileText, Eye, Share2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import * as Sharing from "expo-sharing";

interface PdfActionModalProps {
  navigation: any;
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  pdfFileUri?: any;
  setError: (value: SetStateAction<string | null>) => void;
}

export default function PdfActionModal({
  navigation,
  visible,
  onClose,
  pdfFileUri,
  setError,
  loading = false,
}: PdfActionModalProps) {
  const { t } = useTranslation();

  const handleOpenPdf = async () => {
    if (!pdfFileUri) return;

    onClose();

    navigation.navigate("PdfViewer", {
      pdfUri: pdfFileUri,
    });
  };

  const handleSharePdf = async () => {
    if (!pdfFileUri) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(pdfFileUri, {
          mimeType: "application/pdf",
        });
      }
    } catch (error) {
      console.log(error);
      setError(t("technicianInspectionDetailsScreen.pdfGenerateError"));
    } finally {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <FileText size={28} color={colors.primary} />
            <Text style={styles.title}>{t("pdfOptions.title")}</Text>
          </View>
          <Text style={styles.subtitle}>{t("pdfOptions.subtitle")}</Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonOpen]}
              onPress={handleOpenPdf}
              disabled={loading}
            >
              <Eye size={20} color={colors.black} />
              <Text style={styles.buttonText}>{t("pdfOptions.open")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonShare]}
              onPress={handleSharePdf}
              disabled={loading}
            >
              <Share2 size={20} color={colors.white} />
              <Text style={[styles.buttonText, { color: colors.white }]}>
                {t("pdfOptions.share")}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>{t("close")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: colors.card_item,
    borderRadius: 24,
    padding: 24,
    width: "85%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonOpen: {
    backgroundColor: colors.primary,
  },
  buttonShare: {
    backgroundColor: colors.borderMuted,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
  },
  buttonText: {
    color: colors.black,
    fontWeight: "700",
    fontSize: 15,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});
