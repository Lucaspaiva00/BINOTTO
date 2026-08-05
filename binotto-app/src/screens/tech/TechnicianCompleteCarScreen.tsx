import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { colors } from "@/theme/colors";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import InfiniteImageCarousel from "@/components/common/InfiniteImageCarousel";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/common/AppHeader";
import CarDiagram from "@/components/common/CarDiagram";
import EmptyState from "@/components/common/EmptyState";
import TechnicianManagementService from "@/services/TechnicianManagementService";
import {
  CAR_PARTS,
  createInitialPartsState,
  normalizeReparos,
} from "@/utils/carParts";
import { REPAIR_COLORS } from "@/theme/repairColors";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import { GLOBAL } from "@/constants/global";
import LegendDot from "@/components/common/LegendDot";
import SecureStorageService from "../../services/SecureStorageService";
import { Calendar, Car, Euro, FileDown } from "lucide-react-native";
import InspectionModalVisualizer from "@/components/common/InspectionModalVisualizer";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const storage = GLOBAL.storage;

const hasRelevantData = (repair: any): boolean => {
  if (!repair) return false;

  const tipoReparo = repair?.tipoReparo || repair?.tipo_reparo;
  if (tipoReparo === "SEM_DANO") return false;

  return true;
};

export default function TechnicianCompleteCarScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const serviceId = route.params?.serviceId;

  const [service, setService] = useState<any>(null);
  const [partsState, setPartsState] = useState(() => createInitialPartsState());
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingGeneratePdf, setLoadingGeneratePdf] = useState<boolean>(false);
  const [visualizeModalVisible, setVisualizeModalVisible] = useState(false);
  const [visualizePartId, setVisualizePartId] = useState<string | null>(null);

  const photosOficina = service?.fotos_oficina ?? [];
  const photosTecnico = service?.pericia?.fotos_tecnico
    ? (Object.values(service.pericia.fotos_tecnico) as string[])
    : [];
  const photosPericia = service?.pericia?.fotos_pericia
    ? (Object.values(service.pericia.fotos_pericia) as string[])
    : [];

  const openVisualizeModal = (id: string) => {
    setVisualizePartId(id);
    setVisualizeModalVisible(true);
  };

  const handleCloseVisualizeModal = () => {
    setVisualizeModalVisible(false);
    setVisualizePartId(null);
  };

  const handleShareInspectionPdf = async (inspectionId: number) => {
    try {
      setLoadingGeneratePdf(true);

      const token = await SecureStorageService.getToken();

      const url = `${GLOBAL.baseURL}/tecnico/pericias/${inspectionId}/pdf?token=${token}`;

      const fileUri = `${FileSystem.cacheDirectory}pericia-${inspectionId}.pdf`;

      const result = await FileSystem.downloadAsync(url, fileUri);

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing not available");
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        dialogTitle: t("technicianInspectionDetailsScreen.sharePdf"),
        UTI: "com.adobe.pdf", // iOS
      });
    } catch (error) {
      console.log(error);
      setError(t("technicianInspectionDetailsScreen.pdfGenerateError"));
    } finally {
      setLoadingGeneratePdf(false);
    }
  };

  const handleShareServicePdf = async (serviceId: number) => {
    try {
      setLoadingGeneratePdf(true);

      const token = await SecureStorageService.getToken();

      const url = `${GLOBAL.baseURL}/tecnico/servicos/${serviceId}/pdf?token=${token}`;

      const fileUri = `${FileSystem.cacheDirectory}servico-${serviceId}.pdf`;

      const result = await FileSystem.downloadAsync(url, fileUri);

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing not available");
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        dialogTitle: t("technicianInspectionDetailsScreen.sharePdf"),
        UTI: "com.adobe.pdf", // iOS
      });
    } catch (error) {
      console.log(error);
      setError(t("technicianInspectionDetailsScreen.pdfGenerateError"));
    } finally {
      setLoadingGeneratePdf(false);
    }
  };

  const resetForm = () => {
    setPartsState(createInitialPartsState());
  };

  const loadService = async () => {
    try {
      setLoading(true);
      const res = await TechnicianManagementService.getServiceById(serviceId);
      setService(res.data);

      setPartsState(
        normalizeReparos(res.data.primeiro_veiculo?.reparos_execucao ?? []),
      );
    } catch (err) {
      console.log(err);
      setError(t("technicianCompleteCarScreen.loadingServiceError"));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      resetForm();
      loadService();
    }, [serviceId]),
  );

  const comparisonData = useMemo(() => {
    const periciaRepairs = service?.pericia?.reparos_necessarios ?? [];
    const execucaoRepairs = service?.primeiro_veiculo?.reparos_execucao ?? [];

    const periciaMap = new Map();
    periciaRepairs.forEach((r: any) => {
      periciaMap.set(r.partId || r.peca, r);
    });

    const execucaoMap = new Map();
    execucaoRepairs.forEach((r: any) => {
      execucaoMap.set(r.partId || r.peca, r);
    });

    const result: {
      id: string;
      nome: string;
      pericia: string | null;
      execucao: string | null;
      periciaColor: string;
      execucaoColor: string;
    }[] = [];

    CAR_PARTS.forEach((part) => {
      const periciaRepair = periciaMap.get(part.id);
      const execucaoRepair = execucaoMap.get(part.id);

      const hasPericiaData = hasRelevantData(periciaRepair);
      const hasExecucaoData = hasRelevantData(execucaoRepair);

      if (!hasPericiaData && !hasExecucaoData) {
        return;
      }

      const periciaTipo = periciaRepair?.tipoReparo || null;
      const execucaoTipo = execucaoRepair?.tipoReparo || null;

      result.push({
        id: part.id,
        nome: t(part.labelKey),
        pericia: periciaTipo,
        execucao: execucaoTipo,
        periciaColor: periciaTipo
          ? REPAIR_COLORS[periciaTipo as keyof typeof REPAIR_COLORS]
          : colors.textMuted,
        execucaoColor: execucaoTipo
          ? REPAIR_COLORS[execucaoTipo as keyof typeof REPAIR_COLORS]
          : colors.textMuted,
      });
    });

    return result;
  }, [service, t]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <EmptyState
        title={t("common.serviceNotFound")}
        buttonText={t("common.back")}
        onPress={() => navigation.goBack()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: 0 }]}>
        <AppHeader
          logo={require("@/assets/binotto-dog-logo-cropped.png")}
          title={t("technicianCompleteCarScreen.title")}
          onBack={() => navigation.navigate("Dashboard", { tab: "completed" })}
        />

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.serviceCard}>
            <View style={styles.serviceCardRow}>
              <View>
                <Text numberOfLines={1} style={styles.workshopNameText}>
                  {service?.oficina?.nome_fantasia ?? "-"}
                </Text>
              </View>

              <View style={styles.dateRow}>
                <Calendar size={12} color={colors.primary} />
                <Text style={styles.serviceDateText}>
                  {service?.data_inicio
                    ? formatDate(service.data_inicio)
                    : " --"}
                </Text>
              </View>
            </View>

            <View style={styles.serviceCardRow}>
              <View style={styles.vehiclePlateRow}>
                <Car size={16} color={colors.primary} />
                <Text style={styles.vehiclePlateText}>
                  {service?.primeiro_veiculo?.placa ?? service?.placa ?? "--"}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Euro size={16} color={colors.primary} />
                <Text style={styles.servicePriceText}>
                  {formatCurrency(
                    service?.valor_total ?? 0,
                    service?.moeda,
                    locale,
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.serviceCardRow}>
              <View>
                <Text style={styles.vehicleModelRow}>
                  {service?.primeiro_veiculo?.marca_modelo ??
                    service?.modelo ??
                    "--"}
                </Text>
              </View>
            </View>
          </View>

          { service.pericia?.id && (
            <View style={styles.serviceCard}>
              <Text style={styles.vehiclePlateText}>
                {t("technicianCompleteCarScreen.linkedInspection")}
              </Text>
              <TouchableOpacity
                style={styles.bulkButtonPrimary}
                onPress={() => {
                  const inspectionId = service.pericia?.id;
                  if (inspectionId) {
                    navigation.navigate("InspectionDetail", {
                      inspectionId,
                      backTo: "CompleteCar",
                      backToParams: {
                        serviceId: service.id,
                      },
                    });
                  }
                }}
              >
                <Text style={styles.bulkButtonPrimaryText}>
                  {t("technicianCompleteCarScreen.viewInspection")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.carMapCard}>
            <View style={styles.diagramWrap}>
              <View style={styles.carFrame}>
                <View style={[styles.wheel, styles.wheelFrontLeft]} />
                <View style={[styles.wheel, styles.wheelFrontRight]} />
                <View style={[styles.wheel, styles.wheelRearLeft]} />
                <View style={[styles.wheel, styles.wheelRearRight]} />
                <CarDiagram
                  partsState={partsState}
                  selectedPartId={selectedPartId}
                  setSelectedPartId={(id) => {
                    setSelectedPartId(id);
                    openVisualizeModal(id);
                  }}
                  canEdit={true}
                />
              </View>
            </View>

            <View style={styles.legendRow}>
              <LegendDot
                color={REPAIR_COLORS.PDR}
                label={t("repairTypes.PDR")}
              />
              <LegendDot
                color={REPAIR_COLORS.PINTURA}
                label={t("repairTypes.PINTURA")}
              />
              <LegendDot
                color={REPAIR_COLORS.TROCA}
                label={t("repairTypes.TROCA")}
              />
              <LegendDot
                color={REPAIR_COLORS.ALUMINIO_PDR}
                label={t("repairTypes.ALUMINIO_PDR")}
              />
              <LegendDot
                color={REPAIR_COLORS.ALUMINIO_PINTURA}
                label={t("repairTypes.ALUMINIO_PINTURA")}
              />
              <LegendDot
                color={REPAIR_COLORS.SEM_DANO}
                label={t("repairTypes.SEM_DANO")}
              />
            </View>
          </View>

          {photosOficina?.length > 0 && (
            <InfiniteImageCarousel
              images={photosOficina}
              onImagePress={(uri) => {
                setSelectedImage(`${storage}/${uri}`);
                setViewerVisible(true);
              }}
              title={t("technicianCompleteCarScreen.photos.workshop")}
            />
          )}

          {photosTecnico?.length > 0 && (
            <InfiniteImageCarousel
              images={photosTecnico}
              onImagePress={(uri) => {
                setSelectedImage(`${storage}/${uri}`);
                setViewerVisible(true);
              }}
              title={t("technicianCompleteCarScreen.photos.technician")}
            />
          )}

          { service.pericia?.id && (
            <View style={styles.serviceCard}>
              <Text style={styles.comparisonTitle}>
                {t("technicianCompleteCarScreen.comparisonTitle")}
              </Text>

              <View style={styles.comparisonHeader}>
                <Text
                  style={[styles.comparisonCell, styles.comparisonHeaderText]}
                >
                  {t("technicianCompleteCarScreen.part")}
                </Text>
                <Text
                  style={[styles.comparisonCell, styles.comparisonHeaderText]}
                >
                  {t("technicianCompleteCarScreen.pericia")}
                </Text>
                <Text
                  style={[styles.comparisonCell, styles.comparisonHeaderText]}
                >
                  {t("technicianCompleteCarScreen.executado")}
                </Text>
              </View>

              {comparisonData.map((item) => {
                const periciaLabel = item.pericia
                  ? t(`repairTypes.${item.pericia}`)
                  : "—";
                const execucaoLabel = item.execucao
                  ? t(`repairTypes.${item.execucao}`)
                  : "—";

                return (
                  <View key={item.id} style={styles.comparisonRow}>
                    <Text style={styles.comparisonCell}>{item.nome}</Text>
                    <View style={styles.comparisonCell}>
                      {item.pericia && (
                        <View
                          style={[
                            styles.comparisonDot,
                            { backgroundColor: item.periciaColor },
                          ]}
                        />
                      )}
                      <Text style={styles.comparisonValue}>
                        {periciaLabel}
                      </Text>
                    </View>
                    <View style={styles.comparisonCell}>
                      {item.execucao && (
                        <View
                          style={[
                            styles.comparisonDot,
                            { backgroundColor: item.execucaoColor },
                          ]}
                        />
                      )}
                      <Text style={styles.comparisonValue}>
                        {execucaoLabel}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          { service.pericia?.id && (
            <TouchableOpacity
              style={styles.alterationButton}
              disabled={loadingGeneratePdf}
              onPress={() => {
                const inspectionId = service.pericia?.id;
                if (inspectionId) {
                  handleShareInspectionPdf(inspectionId);
                }
              }}
            >
              <Text style={styles.alterationButtonText}>
                {t("technicianCompleteCarScreen.inspectionPdfButton")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.generatePdfButton}
            onPress={() => {
              const serviceId = service?.id;
              if (serviceId) {
                handleShareServicePdf(serviceId);
              }
            }}
          >
            <FileDown size={18} color={colors.black} />
            <Text style={styles.generatePdfButtonText}>
              {t("technicianCompleteCarScreen.generatePdfButton")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ImageViewerModal
        visible={viewerVisible}
        image={selectedImage}
        onClose={() => {
          setViewerVisible(false);
          setSelectedImage(null);
        }}
      />

      <InspectionModalVisualizer
        visible={visualizeModalVisible}
        partName={
          visualizePartId
            ? t(
                CAR_PARTS.find((part) => part.id === visualizePartId)
                  ?.labelKey ?? "",
              )
            : ""
        }
        value={
          visualizePartId
            ? partsState[visualizePartId]
            : createInitialPartsState()["capo"]
        }
        inspectionComplete={true}
        onClose={handleCloseVisualizeModal}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  label: {
    fontWeight: "500",
    color: colors.textMuted,
  },
  header: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerButton: {
    width: 42,
    height: 42,
    backgroundColor: colors.backgroundSurface,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    color: colors.white,
    fontWeight: "700",
  },
  bulkButtonPrimary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#452165",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#22172a",
  },
  bulkButtonPrimaryText: {
    color: "#caa9ef",
    fontWeight: "600",
    fontSize: 13,
  },
  carMapCard: {},
  diagramWrap: {
    height: 400,
    position: "relative",
    overflow: "hidden",
  },
  carFrame: {
    width: 300,
    height: "100%",
    alignSelf: "center",
    position: "relative",
  },
  wheel: {
    position: "absolute",
    width: 26,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#222A36",
  },
  wheelFrontLeft: {
    left: 8,
    top: 46,
  },
  wheelFrontRight: {
    right: 8,
    top: 46,
  },
  wheelRearLeft: {
    left: 8,
    top: 250,
  },
  wheelRearRight: {
    right: 8,
    top: 250,
  },
  legendRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  serviceCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workshopNameText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "400",
  },
  vehiclePlateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehiclePlateText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  vehicleModelRow: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
  },
  servicePriceText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  serviceDateText: {
    color: "white",
    fontSize: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoSection: {
    gap: 8,
  },
  photoBox: {
    width: "31%",
    height: "31%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  comparisonTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  comparisonHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  comparisonHeaderText: {
    fontWeight: "700",
    color: colors.textMuted,
    fontSize: 13,
  },
  comparisonRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderMuted,
  },
  comparisonCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    color: colors.text,
    fontSize: 14,
  },
  comparisonDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  comparisonValue: {
    color: colors.text,
    fontSize: 14,
  },
  alterationButton: {
    height: 50,
    borderRadius: 14,
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.card_item,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  alterationButtonText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  generatePdfButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generatePdfButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 15,
    marginLeft: 8,
  },
});