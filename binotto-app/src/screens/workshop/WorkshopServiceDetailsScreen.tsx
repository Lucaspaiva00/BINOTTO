import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { colors } from "@/theme/colors";
import WorkshopManagementService from "@/services/WorkshopManagementService";
import { formatCurrency } from "@/utils/currency";
import { formatDate, formatHour } from "@/utils/date";

import { GLOBAL } from "@/constants/global";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import EmptyState from "@/components/common/EmptyState";
import { getStatusLabelKey, statusDotStyles } from "@/utils/status";
import LegendDot from "@/components/common/LegendDot";
import { REPAIR_COLORS } from "@/theme/repairColors";
import CarDiagram from "@/components/common/CarDiagram";
import {
  CAR_PARTS,
  createInitialPartsState,
  normalizeReparos,
} from "@/utils/carParts";
import InspectionModalVisualizer from "@/components/common/InspectionModalVisualizer";
import { Calendar, Car, Clock, Euro, FileDown, Wrench } from "lucide-react-native";
import { colorStatus } from "@/services/ColorStatusService";
import AppHeader from "@/components/common/AppHeader";
import { ScreenContainer } from "@/components/common/ScreenContainer";
import ConfirmModal from "@/components/common/ConfirmModal";
import SecureStorageService from "@/services/SecureStorageService";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const storage = GLOBAL.storage;

export default function WorkshopServiceDetailsScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const serviceId = route.params?.serviceId;

  // states
  const [service, setService] = useState<any>(null);
  const [partsState, setPartsState] = useState(() => createInitialPartsState());

  // utils
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCancel, setLoadingCancel] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [modalInspectionVisible, setModalInspectionVisible] = useState(false);
  const [visualizePartId, setVisualizePartId] = useState<string | null>(null);
  const [loadingGeneratePdf, setLoadingGeneratePdf] = useState<boolean>(false);

    const [rejectVisible, setRejectVisible] = useState(false);

  // constants
  const status = service?.status;
  const isFinalizado = status === "finalizado";
  const isConcluido = status === "concluido";
  const canCancel = status && ["aguardando", "aceito"].includes(status);
  const hasRating = typeof service?.avaliacao === "number";
  const hasArrivalTime = Boolean(
    service?.data_prevista_chegada && service?.horario_previsto_chegada,
  );
  const serviceDateLabel = (() => {
    if (!service?.data_inicio) return "--";
    if (service.data_fim && service.data_fim !== service.data_inicio) {
      return `${formatDate(service.data_inicio)} → ${formatDate(service.data_fim)}`;
    }
    return formatDate(service.data_inicio);
  })();

  const ratingLabels = [
    t("common.ratings.terrible"),
    t("common.ratings.bad"),
    t("common.ratings.regular"),
    t("common.ratings.good"),
    t("common.ratings.excellent"),
  ];

  // functions
  const openPartModal = (id: string) => {
    setVisualizePartId(id);
    setModalInspectionVisible(true);
  };

  const handleClosePartModal = () => {
    setModalInspectionVisible(false);
    setVisualizePartId(null);
  };

  const handleConfirmNotService = async () => {
    setRejectVisible(false);
  };

  // requests
  const handleConfirmService = async () => {
      setRejectVisible(false);
   handleCancelService(Number(service.id));
  };

  const onBack = () => {
    if (isConcluido) {
      navigation.navigate("Dashboard", { tab: "history" });
      return;
    }

    navigation.goBack();
  };

  const handleOpenImage = (uri: string) => {
    setSelectedImage(`${storage}/${uri}`);
    setViewerVisible(true);
  };

  const handleOpenServiceConfirm = async (serviceId: number) => {
    navigation.navigate("ServiceConfirm", {
      serviceId: serviceId,
    });
  };

  const handleShareServicePdf = async (serviceId: number) => {
    try {
      setLoadingGeneratePdf(true);

      const token = await SecureStorageService.getToken();

      const url = `${GLOBAL.baseURL}/oficina/servicos/${serviceId}/pdf?token=${token}`;

      const fileUri = `${FileSystem.cacheDirectory}servico-${serviceId}.pdf`;

      const result = await FileSystem.downloadAsync(url, fileUri);

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing not available");
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        dialogTitle: t("workshopServiceDetailsScreen.sharePdf"),
        UTI: "com.adobe.pdf", // iOS
      });
    } catch (error) {
      console.log(error);
      setError(t("workshopServiceDetailsScreen.pdfGenerateError"));
    } finally {
      setLoadingGeneratePdf(false);
    }
  };

  // requests
  const handleCancelService = async (id: number) => {
    try {
      setError("");
      setLoadingCancel(true);
      await WorkshopManagementService.cancelWorkshopService(id);
      const res = await WorkshopManagementService.getServiceById(serviceId);
      setService(res.data);
         navigation.navigate("Calendar");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("workshopServiceDetailsScreen.cancelServiceError");

      setError(message);
    } finally {
      setLoadingCancel(false);
    }
  };

  const loadService = async () => {
    try {
      setLoading(true);
      const res = await WorkshopManagementService.getServiceById(serviceId);
      setService(res.data);
      setPartsState(normalizeReparos(res.data.primeiro_veiculo?.reparos_execucao ?? []));
    } catch (err) {
      setError(t("workshopServiceDetailsScreen.loadingServiceError"));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadService();
    }, [serviceId]),
  );

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
    <ScreenContainer padding={0}>
      <View style={{ flex: 1, marginTop: 0 }}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: colors.backgroundBase,
          }}
        >
          {/* Header */}

          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.headerButton}>
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isConcluido
                ? t("workshopServiceDetailsScreen.titleCompleted")
                : t("workshopServiceDetailsScreen.title")}
            </Text>
          </View>
          {error && (
            <ErrorAlert message={error} onClose={() => setError(null)} />
          )}
          <ScrollView contentContainerStyle={styles.content}>
            {/* CARD PRINCIPAL */}
            <View style={styles.card}>
              {/* HEADER */}
              <View style={styles.topRow}>
                <View style={styles.row}>
                  <View />

                  <Text style={styles.title}>{""}</Text>
                </View>

                <View
                  style={[
                    styles.badge,
                    {
                      borderLeftWidth: 0.3,
                      borderRightWidth: 0.3,
                      borderTopWidth: 0.3,
                      borderBottomWidth: 0.3,
                      backgroundColor: `${colorStatus(service.status)}20`,
                      borderColor:
                        colorStatus(service.status) ?? colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      ...styles.badgeText,
                      color: colorStatus(service.status),
                    }}
                  >
                    {t(getStatusLabelKey(service.status))}
                  </Text>
                </View>
              </View>

              {/* INFO */}
              <View style={styles.infoBlock}>
                <View style={styles.infoItem}>
                  <Calendar size={16} color={colors.primary} />
                  <Text style={styles.infoText}>{serviceDateLabel}</Text>
                </View>

                {hasArrivalTime && (
                  <View style={styles.infoItem}>
                    <Clock size={16} color={colors.primary} />
                    <Text style={styles.infoText}>
                      {`${formatDate(service.data_prevista_chegada)} ${formatHour(service.horario_previsto_chegada)}`}
                    </Text>
                  </View>
                )}

                <View style={styles.infoItem}>
                  {service.quantidade_tipo === "carros" ? (
                    <Car size={16} color={colors.primary} strokeWidth={2} />
                  ) : (
                    <Calendar
                      size={16}
                      color={colors.primary}
                      strokeWidth={2}
                    />
                  )}
                  <Text style={styles.infoText}>
                    {service.quantidade ?? "--"}
                  </Text>
                </View>

                {service.tecnico && (
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons
                      name="account-hard-hat"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.infoText}>
                      {service.tecnico?.nome_completo ?? "--"}
                    </Text>
                  </View>
                )}

                <View style={styles.infoItem}>
                  <Euro size={14} color={colors.primary} />
                  <Text style={styles.price}>
                    {formatCurrency(
                      service.valor_total ?? 0,
                      service.moeda,
                      locale,
                    )}
                  </Text>
                </View>
              </View>

              {/* OBS */}
              {!!service.observacoes && (
                <View style={styles.obsBox}>
                  <Text style={styles.obsLabel}>
                    {t("workshopServiceDetailsScreen.observations")}
                  </Text>
                  <Text style={styles.obsText}>{service.observacoes}</Text>
                </View>
              )}
            </View>

            {service.primeiro_veiculo?.finalizado_em && (
              <View style={styles.vehicleCard}>
                <View style={styles.vehicleCardBody}>
                  <View style={styles.vehicleInfo}>
                    <View style={styles.vehiclePlateRow}>
                      <Car size={20} color={colors.primary} />

                      <Text style={styles.vehiclePlate}>
                        {service?.primeiro_veiculo?.placa ??
                          service?.placa ??
                          "--"}
                      </Text>
                    </View>

                    <Text style={styles.vehicleModel}>
                      {service?.primeiro_veiculo?.marca_modelo ??
                        service?.modelo ??
                        "--"}
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.servicePrice}>
                      {formatCurrency(
                        service?.valor_total ?? 0,
                        service?.moeda,
                        locale,
                      )}
                    </Text>

                    <View style={styles.dateRow}>
                      <Calendar size={12} color={colors.textMuted} />

                      <Text style={styles.vehicleDate}>
                        {service?.data_inicio
                          ? formatDate(service.data_inicio)
                          : "--"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {hasRating && (
              <View style={styles.ratingCard}>
                <Text style={styles.ratingTitle}>
                  {t("workshopServiceDetailsScreen.rating")}
                </Text>

                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <View key={star} style={styles.starButton}>
                      <FontAwesome
                        name={star <= service.avaliacao ? "star" : "star-o"}
                        size={30}
                        color={
                          star <= service.avaliacao
                            ? colors.primary
                            : colors.textMuted
                        }
                      />

                      <Text
                        style={[
                          styles.starLabel,
                          star <= service.avaliacao && styles.starLabelActive,
                        ]}
                      >
                        {ratingLabels[star - 1]}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.ratingText}>{service.avaliacao}/5</Text>
              </View>
            )}

            {/* DIAGRAMA DA EXECUÇÃO */}
            {service.primeiro_veiculo?.finalizado_em && (
              <View style={styles.carMapCard}>
                <Text style={styles.carMapSubtitle}>
                  {t("workshopServiceDetailsScreen.carDiagram.hint")}
                </Text>
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
            )}

            {/* AÇÕES */}
            {service?.pericia?.id && (
              <TouchableOpacity
                style={styles.viewInspectionButton}
                onPress={() =>
                  navigation.navigate("InspectionDetails", {
                    inspectionId: service.pericia?.id ?? 0,
                  })
                }
              >
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={18}
                  color={colors.black}
                />
                <Text style={styles.viewInspectionButtonText}>
                  {t("workshopServiceDetailsScreen.viewInspection")}
                </Text>
              </TouchableOpacity>
            )}

            {/* FINALIZAR */}
            {isFinalizado && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleOpenServiceConfirm(Number(service.id))}
              >
                <Text style={styles.confirmButtonText}>
                  {t("workshopServiceDetailsScreen.confirm")}
                </Text>
              </TouchableOpacity>
            )}

            {/* CANCELAR */}
            {canCancel && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  loadingCancel && styles.buttonDisabled,
                ]}
                onPress={() => setRejectVisible(true)}
                disabled={loadingCancel}
              >
                {loadingCancel && (
                  <ActivityIndicator size="small" color="#ef4444" />
                )}
                <Text style={styles.cancelButtonText}>
                  {loadingCancel
                    ? t("workshopServiceDetailsScreen.canceling")
                    : t("workshopServiceDetailsScreen.cancelService")}
                </Text>
              </TouchableOpacity>
            )}

            {/* CONCLUÍDO */}
            {isConcluido && (
              <TouchableOpacity
                style={styles.generatePdfButton}
                disabled={loadingGeneratePdf}
                onPress={() => handleShareServicePdf(Number(service.id))}
              >
                {loadingGeneratePdf ? (
                  <ActivityIndicator size="small" color={colors.black} />
                ) : (
                  <>
                    <FileDown size={18} color={colors.black} />
                    <Text style={styles.generatePdfButtonText}>
                      {t("workshopServiceDetailsScreen.generatePdfButton")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
              inspectionComplete={false}
              onClose={handleClosePartModal}
            />
          )}
        </SafeAreaView>
      </View>

      <ConfirmModal
        visible={rejectVisible}
        variant="double"
        type={"error"}
        title={t("workshopConfirmServiceScreen.confirmCancelTitle")}
        subtitle={t("workshopConfirmServiceScreen.confirmCancelSubtitle")}
        confirmText={t("workshopConfirmServiceScreen.cancelService")}
        cancelText={t("common.cancel")}
        onConfirm={handleConfirmService}
        onCancel={handleConfirmNotService}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: "black",
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

  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 16,
    gap: 16,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: colors.card_item,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    padding: 12,
    gap: 14,
    marginBottom: 8,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  badgeText: {
    color: colors.black,
    fontSize: 11,
    fontWeight: "700",
  },

  infoBlock: {
    gap: 12,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  infoText: {
    color: "white",
    fontSize: 13,
  },

  price: {
    color: "white",
    fontSize: 14,
  },

  obsBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  obsLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },

  obsText: {
    color: colors.text,
    fontSize: 13,
  },

  photosSection: {
    gap: 10,
    marginBottom: 16,
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
    borderWidth: 1,
    // borderStyle: "dashed",
    borderColor: colors.borderMutedCard,
    backgroundColor: colors.card_item,
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
    borderColor: colors.borderMutedCard,
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

  confirmButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  confirmButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 15,
  },

  generatePdfButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  generatePdfButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 15,
  },

  cancelButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#a1171767",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  cancelButtonText: {
    color: "#de5252c7",
    fontWeight: "800",
    fontSize: 15,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  // Rating
  ratingCard: {
    backgroundColor: colors.backgroundSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },

  ratingTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  starButton: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  starLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },

  starLabelActive: {
    color: colors.white,
    fontWeight: "700",
  },

  ratingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  viewInspectionButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },

  viewInspectionButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 15,
  },

  // Diagrama do carro
  carMapCard: {
    borderRadius: 14,
    padding: 12,
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Card do Veículo
  vehicleCard: {
    backgroundColor: colors.backgroundSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },

  vehicleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  vehicleCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  vehicleInfo: {
    flex: 1,
  },

  vehiclePlateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  vehiclePlate: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },

  vehicleModel: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },

  priceContainer: {
    alignItems: "flex-end",
  },

  servicePrice: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  vehicleDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
