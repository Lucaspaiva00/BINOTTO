import { SetStateAction, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { GLOBAL } from "@/constants/global";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/common/AppHeader";
import EmptyState from "@/components/common/EmptyState";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import LegendDot from "@/components/common/LegendDot";
import { REPAIR_COLORS } from "@/theme/repairColors";
import CarDiagram from "@/components/common/CarDiagram";
import {
  CAR_PARTS,
  createInitialPartsState,
  normalizeReparos,
} from "@/utils/carParts";
import InspectionModalVisualizer from "@/components/common/InspectionModalVisualizer";
import TechnicianInspectionService from "@/services/TechnicianInspectionService";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Car, Eye, FileText, Wrench } from "lucide-react-native";
import TechnicianManagementService from "@/services/TechnicianManagementService";
import PdfActionModal from "@/components/common/PdfActionModal";
import SecureStorageService from "../../services/SecureStorageService";
import InfiniteImageCarousel from "@/components/common/InfiniteImageCarousel";

const storage = GLOBAL.storage;

const getRepairColor = (key: string) => {
  switch (key) {
    case "SEM_DANO":
      return REPAIR_COLORS.SEM_DANO;
    case "PDR":
      return REPAIR_COLORS.PDR;
    case "PINTURA":
      return REPAIR_COLORS.PINTURA;
    case "TROCA":
      return REPAIR_COLORS.TROCA;
    case "ALUMINIO":
      return REPAIR_COLORS.ALUMINIO_PDR;
    case "ORIGINAL":
      return REPAIR_COLORS.SEM_DANO;
    default:
      return "#fff";
  }
};

export default function TechnicianInspectionDetailsScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const inspectionId = route.params?.inspectionId;
  const { backTo, backToParams } = route.params;

  const [loadingStartCar, setLoadingStartCar] = useState<boolean>(false);
  const [inspection, setInspection] = useState<any>(null);
  const [partsState, setPartsState] = useState(() => createInitialPartsState());
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingGeneratePdf, setLoadingGeneratePdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [modalInspectionVisible, setModalInspectionVisible] = useState(false);
  const [visualizePartId, setVisualizePartId] = useState<string | null>(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [pdfFileUri, setPdfFileUri] = useState<string | null>(null);

  // const photosBase = Object.values(
  //   (inspection?.fotos ?? {}) as Record<string, string>
  // );

  // const photosPericiaCompleta = Object.values(
  //   (inspection?.fotos_pericia_completa ?? {}) as Record<string, string>
  // );

  const photosPericia = [
    ...Object.values(
      (inspection?.fotos ?? {}) as Record<string, string>
    ),
    ...Object.values(
      (inspection?.fotos_pericia_completa ?? {}) as Record<string, string>
    ),
  ];

  const openPartModal = (id: string) => {
    setVisualizePartId(id);
    setModalInspectionVisible(true);
  };

  const handleClosePartModal = () => {
    setModalInspectionVisible(false);
    setVisualizePartId(null);
  };

  const handleOpenImage = (uri: string) => {
    setSelectedImage(`${storage}/${uri}`);
    setViewerVisible(true);
  };

  const handleSharePdf = async () => {
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

  const handleStartCarFromInspection = async (inspectionId: number) => {
    try {
      setError("");
      setLoadingStartCar(true);
      const response =
        await TechnicianManagementService.startServiceFromInspection(
          inspectionId,
        );
      navigation.navigate("Dashboard");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianInspectionsScreen.startCarError");
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
      setPartsState(normalizeReparos(res.data.reparos_necessarios ?? []));
    } catch (err) {
      setError(t("technicianInspectionDetailsScreen.loadingInspectionError"));
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
        onPress={() => navigation.navigate("Inspections")}
      />
    );
  }

  const getRepairCounts = () => {
    const counts: Record<string, number> = {};
    const reparos = inspection?.reparos_necessarios ?? [];
    reparos.forEach((repair: any) => {
      const key = repair.tipo_reparo??repair.tipoReparo;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  const repairCounts = getRepairCounts();


 const REPAIR_TYPES = {
  SEM_DANO: {
    color: REPAIR_COLORS.SEM_DANO,
    translationKey: "repairTypes.SEM_DANO",
  },
  PDR: {
    color: REPAIR_COLORS.PDR,
    translationKey: "repairTypes.PDR",
  },
  PINTURA: {
    color: REPAIR_COLORS.PINTURA,
    translationKey: "repairTypes.PINTURA",
  },
  TROCA: {
    color: REPAIR_COLORS.TROCA,
    translationKey: "repairTypes.TROCA",
  },
  ALUMINIO_PDR: {
    color: REPAIR_COLORS.ALUMINIO_PDR,
    translationKey: "repairTypes.ALUMINIO_PDR",
  },
  ALUMINIO_PINTURA: {
    color: REPAIR_COLORS.ALUMINIO_PINTURA,
    translationKey: "repairTypes.ALUMINIO_PINTURA",
  },
} as const;

type RepairType = keyof typeof REPAIR_TYPES;

const displayOrder: RepairType[] = [
  "SEM_DANO",
  "PDR",
  "PINTURA",
  "TROCA",
  "ALUMINIO_PDR",
  "ALUMINIO_PINTURA",
];
  const showStatusSummary =
    inspection.status === "em_execucao" || inspection.status == "aberta";

  let statusColor = "#34d399";
  let statusLabel = t("common.inspectionStatus.open");
  if (inspection.status === "em_execucao") {
    statusColor = colors.warning;
    statusLabel = t("common.inspectionStatus.inProgress");
  }
  if (inspection.status === "concluida") {
    statusColor = "#60A5FA";
    statusLabel = t("common.inspectionStatus.closed");
  }

  return (
    <View style={styles.container}>
      <AppHeader
        logo={require("@/assets/binotto-dog-logo-cropped.png")}
        title={t("technicianInspectionDetailsScreen.title")}
        onBack={() => {
          if (backTo === "CompleteCar") {
            navigation.navigate("CompleteCar", {
              serviceId: backToParams?.serviceId!,
            });
          } else if (backTo) {
            navigation.navigate(backTo);
          } else {
            navigation.goBack();
          }
        }}
      />
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <Text style={styles.summaryCardWorkshop}>
              {inspection?.oficina?.nome_fantasia ?? "--"}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: `${statusColor}20`,
                  borderColor: `${statusColor}60`,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCardBody}>
            <View style={styles.summaryCardInfo}>
              <View style={styles.summaryCardPlateRow}>
                <Text style={styles.summaryCardPlate}>
                  {inspection?.placa ?? "--"}
                </Text>
              </View>
              <Text style={styles.summaryCardModel}>
                {inspection?.marca_modelo ?? "--"}
              </Text>
            </View>

            <View style={styles.summaryCardPriceContainer}>
              <View style={styles.summaryCardDateRow}>
                <Text style={styles.summaryCardDate}>
                  {formatDate(inspection.created_at)}
                </Text>
              </View>
              <Text style={styles.summaryCardInspectionPrice}>
                {formatCurrency(
                  inspection?.valor_pericia ?? inspection?.preco_sugerido ?? 0,
                  inspection?.moeda,
                  locale,
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.detailTitle}>
            {t("technicianNewServiceScreen.modelLabel")}
          </Text>
          <View
            style={{ justifyContent: "space-between", flexDirection: "row" }}
          >
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                {t("technicianNewServiceScreen.plateLabel")}
              </Text>
              <Text style={styles.detailValue}>
                {inspection?.placa ?? "--"}
              </Text>
            </View>
            {inspection?.chassi && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Chassi</Text>
                <Text style={styles.detailValue}>{inspection.chassi}</Text>
              </View>
            )}
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>
              {t("technicianNewServiceScreen.modelLabel")}
            </Text>
            <Text style={styles.detailValue}>
              {inspection?.marca_modelo ?? "--"}
            </Text>
          </View>
        </View>

        {/* {photosBase && photosBase.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.photosTitle}>
              {t("common.generalPhotos")}
            </Text>

            <View style={styles.grid}>
              {photosBase.map((uri: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => handleOpenImage(uri)}
                  style={styles.photoBoxWithoutDash}
                >
                  <Image
                    source={{ uri: `${storage}/${uri}` }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )} */}



        {photosPericia && photosPericia.length > 0 && (
  <InfiniteImageCarousel
    images={photosPericia}
    onImagePress={handleOpenImage}
    title={t("technicianInspectionDetailsScreen.inspectionPhotos")}
    showIndicators={true}
   
  />
)}

        <View style={styles.carMapCard}>
          {/* <Text style={styles.carMapSubtitle}>
            {t("technicianInspectionDetailsScreen.carDiagram.hint")}
          </Text> */}
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
                  openPartModal(id);
                }}
                canEdit={true}
                allowUndamagedParts={false}
              />
            </View>
          </View>
          <View style={styles.legendRow}>
            <LegendDot color={REPAIR_COLORS.PDR} label={t("repairTypes.PDR")} />

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

        {!showStatusSummary ? (
          <TouchableOpacity
            style={[
              styles.generatePdfButton,
              loadingGeneratePdf && styles.buttonDisabled,
            ]}
            disabled={loadingGeneratePdf}
            onPress={handleSharePdf}
          >
            {loadingGeneratePdf ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <>
                <FileText size={18} color={colors.black} />
                <Text style={styles.generatePdfButtonText}>
                  {t("technicianInspectionDetailsScreen.generatePdf")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.summaryAlterationsCard}>
              <Text style={styles.summaryAlterationsTitle}>
                {t("technicianInspectionDetailsScreen.summaryTitle")}
              </Text>

              {displayOrder.map((key) => {
                const count = repairCounts[key] || 0;
                if (count === 0) return null;
                const typeInfo = REPAIR_TYPES[key] || key;
                return (
                  <View key={key} style={styles.alterationRow}>
                    <LegendDot
                      color={getRepairColor(
                        key == "SEM_DANO" ? "ORIGINAL" : key,
                      )}
                      label={t(typeInfo.translationKey)}
                    />
                    <Text style={styles.alterationCount}>
                      {t("common.pieceCount", { count })}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View
              style={{
                ...styles.summaryAlterationsCard,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.alterationValueLabel}>
                {t("technicianInspectionDetailsScreen.inspectionValueLabel")}
              </Text>
              <Text style={styles.alterationValue}>
                {formatCurrency(
                  inspection?.valor_pericia ?? 0,
                  inspection?.moeda,
                  locale,
                )}
              </Text>
            </View>

            {/* AÇÕES */}
            { inspection.status !== "em_execucao" && (
              <>
                <TouchableOpacity
                  style={[
                    styles.generatePdfButton,
                    loadingGeneratePdf && styles.buttonDisabled,
                  ]}
                  disabled={loadingGeneratePdf}
                  onPress={handleSharePdf}
                >
                  {loadingGeneratePdf ? (
                    <ActivityIndicator size="small" color={colors.black} />
                  ) : (
                    <>
                      <FileText size={18} color={colors.black} />
                      <Text style={styles.generatePdfButtonText}>
                        {t("technicianInspectionDetailsScreen.generatePdf")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alterationButton}
                  onPress={() => {
                    if (inspection.status === "aberta") {
                      handleStartCarFromInspection(Number(inspection.id));
                    } else {
                      navigation.navigate("ServiceExecution", {
                        serviceId: inspection.servico_id,
                      });
                    }
                  }}
                >
                  {inspection.status === "aberta" ? (
                    <Car size={20} color={colors.white} />
                  ) : (
                    <Wrench size={20} color={colors.white} />
                  )}

                  <Text style={styles.alterationButtonText}>
                    {inspection.status === "aberta"
                      ? t("technicianDashboardScreen.initCar")
                      : t("technicianInspectionDetailsScreen.viewExecution")}
                  </Text>
                </TouchableOpacity>   
              </>
            )}
   
          </View>
        )}

        {/* {
           inspection.status === "concluida"?
           <TouchableOpacity
            style={[
              styles.alterationButton,
            ]}
            onPress={()=>{
              navigation.navigate("CompleteCar", {
                    serviceId: Number(inspection.servico_id),
                  });
            }}
          >
            
              <>
               <Eye size={18} color={colors.white} />
                <Text style={styles.alterationButtonText}>
                  {t("technicianInspectionDetailsScreen.viewCompletedCar")}
                </Text>
              </>
  
          </TouchableOpacity>:undefined
        } */}
      </ScrollView>

      <ImageViewerModal
        visible={viewerVisible}
        image={selectedImage}
        onClose={() => {
          setViewerVisible(false);
          setSelectedImage(null);
        }}
      />

      {modalInspectionVisible && visualizePartId && (
        <InspectionModalVisualizer
          visible={modalInspectionVisible}
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
          onClose={handleClosePartModal}
        />
      )}

      <PdfActionModal
        navigation={navigation}
        visible={pdfModalVisible}
        pdfFileUri={pdfFileUri}
        onClose={() => {
          setPdfModalVisible(false);
          setPdfFileUri(null);
        }}
        loading={loadingGeneratePdf}
        setError={setError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 16,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  photosSection: {
    gap: 10,
    padding: 12,
    backgroundColor: colors.card_item,
    borderColor: colors.borderMutedCard,
    borderWidth: 1,
    borderRadius: 16,
  },
  photosTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoBox: {
    width: "25%",
    height: "25%",
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
  photoBoxWithoutDash: {
    width: "25%",
    height: "25%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 2,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  generatePdfButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  generatePdfButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 15,
  },
  carMapCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: colors.card_item,
    borderColor: colors.borderMutedCard,
    borderWidth: 1,
  },
  carMapSubtitle: {
    color: colors.textMuted,
    marginBottom: 10,
    fontSize: 12,
  },
  diagramWrap: {
    height: 400,
    borderRadius: 12,
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: colors.card_item,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    padding: 16,
    gap: 8,
  },
  summaryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCardWorkshop: {
    color: colors.white,
    fontWeight: "400",
    fontSize: 13,
  },
  summaryCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryCardInfo: {
    flex: 1,
  },
  summaryCardPlateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryCardPlate: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  summaryCardModel: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
  },
  summaryCardPriceContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 0.5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  summaryCardInspectionPrice: {
    color: colors.white,
    fontSize: 18,
    marginTop: 8,
    fontWeight: "800",
  },
  summaryCardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  summaryCardDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  summaryAlterationsCard: {
    backgroundColor: colors.card_item,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    padding: 16,
    marginBottom: 16,
    gap: 0,
  },
  summaryAlterationsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  alterationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  alterationCount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  alterationDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 8,
  },
  alterationValueLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  alterationValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  alterationButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 4,
    gap: 12,
  },
  alterationButton: {
    height: 50,
    borderRadius: 14,
    borderColor: colors.borderMutedCard,
    borderWidth: 1,
    backgroundColor: colors.card_item,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  alterationButtonText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.card_item,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  detailItem: {
    paddingVertical: 4,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  detailValue: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "400",
  },
  detailTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
});
