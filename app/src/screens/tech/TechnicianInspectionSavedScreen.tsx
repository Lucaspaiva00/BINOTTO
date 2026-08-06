import { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import Svg, { Path, Circle } from "react-native-svg";

import { colors } from "@/theme/colors";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/common/AppHeader";
import TechnicianInspectionService from "@/services/TechnicianInspectionService";
import EmptyState from "@/components/common/EmptyState";
import { CircleCheckBig, FileText, List } from "lucide-react-native";
import TechnicianManagementService from "@/services/TechnicianManagementService";

export default function TechnicianInspectionSavedScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const inspectionId = route.params?.inspectionId;

  // states
  const [inspection, setInspection] = useState<any>(null);

  // utils
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStartCar, setLoadingStartCar] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // requests
  const handleViewInspectionPdf = async () => {
    try {
      setError("");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianInspectionSavedScreen.startCarError");

      setError(message);
    }
  };

  const handleStartCarFromInspection = async () => {
    try {
      setError("");
      setLoadingStartCar(true);

      const response = await TechnicianManagementService.startServiceFromInspection(inspection.id);

      navigation.navigate("ServiceExecution", {
        serviceId: response.data.id,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianInspectionSavedScreen.startCarError");

      setError(message);
    } finally {
      setLoadingStartCar(false);
    }
  };

  const loadInspection = async () => {
    try {
      setLoading(true);

      const res =
        await TechnicianInspectionService.getInspectionById(inspectionId);
      setInspection(res.data);
    } catch (err) {
      setError(t("technicianInspectionSavedScreen.loadingInspectionError"));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInspection();
    }, [inspectionId]),
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!inspection) {
    return (
      <EmptyState
        title={t("common.inspectionNotFound")}
        buttonText={t("common.back")}
        onPress={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      {/* Header */}
      <AppHeader
        logo={require("@/assets/binotto-dog-logo-cropped.png")}
        title={t("technicianInspectionSavedScreen.title")}
        onBack={() => navigation.goBack()}
      />
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      <View style={styles.content}>
        <CircleCheckBig size={64} color={colors.primary} strokeWidth={2.5} />

        <Text style={styles.title}>
          {t("technicianInspectionSavedScreen.titleInspectionSaved")}
        </Text>

        <Text style={styles.subtitle}>
          {t("technicianInspectionSavedScreen.subtitle")}
        </Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.buttonPrimaryOutline}
            onPress={handleViewInspectionPdf}
            activeOpacity={0.8}
            disabled={loadingStartCar}
          >
            <FileText size={20} color={colors.primary} strokeWidth={2} />

            <Text style={styles.buttonPrimaryOutlineText}>
              {t("technicianInspectionSavedScreen.viewInspectionPdfButton")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buttonPrimary,
              loadingStartCar && styles.buttonPrimaryDisabled,
            ]}
            onPress={handleStartCarFromInspection}
            activeOpacity={0.8}
            disabled={loadingStartCar}
          >
            {loadingStartCar ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
                    stroke={colors.black}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx={7}
                    cy={17}
                    r={2}
                    stroke={colors.black}
                    strokeWidth={2}
                  />
                  <Path
                    d="M9 17h6"
                    stroke={colors.black}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <Circle
                    cx={17}
                    cy={17}
                    r={2}
                    stroke={colors.black}
                    strokeWidth={2}
                  />
                </Svg>

                <Text style={styles.buttonPrimaryText}>
                  {t("technicianInspectionSavedScreen.startCarButton")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonBackToList}
            onPress={() => navigation.navigate("Inspections")}
            activeOpacity={0.8}
          >
            <List size={20} color={colors.white} strokeWidth={2} />

            <Text style={styles.buttonBackToListText}>
              {t("technicianInspectionSavedScreen.backToListButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 20,
    textAlign: "center",
    marginVertical: 14,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },

  actionContainer: {
    width: "100%",
    gap: 12,
  },

  buttonBackToList: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#141414",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  buttonBackToListText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  buttonPrimary: {
    width: "100%",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  buttonPrimaryOutline: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#0A0A0A",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  buttonPrimaryText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "700",
  },

  buttonPrimaryOutlineText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },

  buttonPrimaryDisabled: {
    opacity: 0.7,
  },
});
