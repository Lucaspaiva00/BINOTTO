import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import InfiniteImageCarousel from "@/components/common/InfiniteImageCarousel";

import { colors } from "@/theme/colors";
import WorkshopManagementService from "@/services/WorkshopManagementService";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/currency";
import { formatDate } from "@/utils/date";

import { GLOBAL } from "@/constants/global";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import { FontAwesome } from "@expo/vector-icons";
import { SuccessAlert } from "@/components/common/SuccessAlert";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmptyState from "@/components/common/EmptyState";
import LegendDot from "@/components/common/LegendDot";
import { REPAIR_COLORS } from "@/theme/repairColors";
import CarDiagram from "@/components/common/CarDiagram";
import {
  CAR_PARTS,
  createInitialPartsState,
  normalizeReparos,
} from "@/utils/carParts";
import InspectionModalVisualizer from "@/components/common/InspectionModalVisualizer";
import { Photo } from "@/types/carParts";

const storage = GLOBAL.storage;

// ===== MODELOS DE FOTOS =====
const FOTOS_SERVICO_MODEL: Record<string, string> = {
  diagonalFrontDriver: "Diagonal Frente",
  diagonalRearPassenger: "Diagonal Traseira",
  plateOrChassis: "Placa / Chassi",
  workOrder: "Ordem de Serviço",
};

const FOTOS_PERÍCIA_MODEL: Record<string, string> = {
  chassis: "Chassi",
  document: "Documento",
  km: "Quilometragem",
};

export default function WorkshopConfirmServiceScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const serviceId = route.params?.serviceId;

  // states
  const [service, setService] = useState<any>(null);
  const [partsState, setPartsState] = useState(() => createInitialPartsState());
  const [carValue, setCarValue] = useState<string>("");
  const [rating, setRating] = useState<number>(0);

  // utils
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingConfirm, setLoadingConfirm] = useState<boolean>(false);
  const [loadingReject, setLoadingReject] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "confirm" | "reject" | null
  >(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [modalInspectionVisible, setModalInspectionVisible] = useState(false);
  const [visualizePartId, setVisualizePartId] = useState<string | null>(null);

  const [complete, setComplete] = useState(false);

  // constants
  const status = service?.status;
  const isFinalizado = status === "finalizado";
  const ratingLabels = [
    t("common.ratings.terrible"),
    t("common.ratings.bad"),
    t("common.ratings.regular"),
    t("common.ratings.good"),
    t("common.ratings.excellent"),
  ];

  // ===== CONSTRUÇÃO DOS DADOS DE FOTOS COM MODELO =====
  const fotosServicoEntries = Object.entries(service?.fotos ?? {})
    .filter(([key]) => FOTOS_SERVICO_MODEL[key])
    .map(([key, uri]) => ({
      key,
      label: FOTOS_SERVICO_MODEL[key],
      uri: uri as string,
    }));

  const fotosPericiaEntries = Object.entries(service?.fotos_pericia_completa ?? {})
    .filter(([key]) => FOTOS_PERÍCIA_MODEL[key])
    .map(([key, uri]) => ({
      key,
      label: FOTOS_PERÍCIA_MODEL[key],
      uri: uri as string,
    }));

  // Garantir pelo menos 3 slots (placeholder)
  const fotosServicoSlots = Math.max(3, fotosServicoEntries.length);
  const fotosPericiaSlots = Math.max(3, fotosPericiaEntries.length);

  // functions
  const openPartModal = (id: string) => {
    setVisualizePartId(id);
    setModalInspectionVisible(true);
  };

  const handleClosePartModal = () => {
    setModalInspectionVisible(false);
    setVisualizePartId(null);
  };

  const onBack = () => {
    navigation.goBack();
  };

  const resolveImageUri = (uri: string) => {
    if (!uri) return uri;
    if (
      uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("data:image/")
    ) {
      return uri;
    }
    return `${storage}/${String(uri).replace(/^\/+/, "")}`;
  };

  const handleOpenImage = (uri: string) => {
    setSelectedImage(resolveImageUri(uri));
    setViewerVisible(true);
  };

  const openConfirmModal = (action: "confirm" | "reject") => {
    setConfirmAction(action);
    setConfirmVisible(true);
  };

  const handleModalCancel = () => {
    setConfirmVisible(false);
    setConfirmAction(null);
  };

  const handleModalConfirm = async () => {
    setConfirmVisible(false);

    if (confirmAction === "confirm") {
      await handleConfirmService(Number(service.id));
    }

    if (confirmAction === "reject") {
      await handleRejectService(Number(service.id));
    }

    setConfirmAction(null);
  };

  // requests
  const handleConfirmService = async (id: number) => {
    try {
      setError(null);
      setSuccess(null);
      setLoadingConfirm(true);

      if (!rating) {
        setError(t("workshopConfirmServiceScreen.ratingRequired"));
        return;
      }

      const payload = {
        avaliacao: rating,
        valor_final: (Number(carValue) / 100).toFixed(2),
      };

      const res = await WorkshopManagementService.confirmWorkshopService(
        id,
        payload,
      );

      navigation.navigate("Dashboard");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("workshopConfirmServiceScreen.confirmServiceError");

      setError(message);
    } finally {
      setLoadingConfirm(false);
    }
  };

  const handleRejectService = async (id: number) => {
    try {
      setError(null);
      setSuccess(null);
      setLoadingReject(true);

      const res = await WorkshopManagementService.rejectWorkshopService(id);

      setService(res.data);
      setSuccess(res.message);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("workshopConfirmServiceScreen.confirmServiceError");

      setError(message);
    } finally {
      setLoadingReject(false);
    }
  };

  const loadService = async () => {
    try {
      setLoading(true);
      const res = await WorkshopManagementService.getServiceById(serviceId);
      const service = res.data;

      const tipo = service.tipo_pericia;
      if (tipo === "completa") {
        setComplete(true);
      } else {
        setComplete(false);
      }

      setService(service);

      console.log(service)

      const price = tipo === "completa" ?
        String(Number(service.valor_pericia) * 100 || "0") :
        String(Number(service.preco_sugerido) * 100 || "0");

      setCarValue(price);
      setPartsState(normalizeReparos(res.data.primeiro_veiculo?.reparos_execucao ?? []));
    } catch (err) {
      setError(t("workshopConfirmServiceScreen.loadServiceError"));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRating(0);
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
    <View style={[styles.container, {}]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {t("workshopConfirmServiceScreen.title")}
        </Text>
      </View>

      {error && (
        <View style={{ marginVertical: 16, marginHorizontal: 20 }}>
          <ErrorAlert message={error} onClose={() => setError(null)} />
        </View>
      )}

      {success && (
        <View style={{ marginVertical: 16, marginHorizontal: 20 }}>
          <SuccessAlert message={success} onClose={() => setSuccess(null)} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {/* CARD PRINCIPAL */}
        <View style={styles.carCard}>
          <View style={styles.plateRow}>
            <Text style={styles.plate}>{service.placa ?? "--"}</Text>
            <Text style={styles.date}>{formatDate(service.data_inicio)}</Text>
          </View>

          <View style={styles.modelRow}>
            <Text style={styles.model}>
              {service.primeiro_veiculo?.marca_modelo ?? "--"}
            </Text>

            <View style={styles.priceInput}>
              <TextInput
                value={formatCurrencyInput(carValue, locale)}
                onChangeText={(text) => {
                  if(complete){
                    return;
                  }

                  const value = parseCurrencyInput(text);
                  setCarValue(value);
                }}
                keyboardType="numeric"
                placeholder="Valor"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                editable={!complete}
              />
            </View>
          </View>

          <View style={styles.techRow}>
            <Text style={styles.techLabel}>
              {t("workshopConfirmServiceScreen.technician")}:
            </Text>
            <Text style={styles.techName}>
              {service.tecnico?.nome_completo ?? "--"}
            </Text>
          </View>
        </View>

        {/* DIAGRAMA DA EXECUÇÃO */}
        {true && (
          <View style={styles.carMapCard}>
            <Text style={styles.carMapSubtitle}>
              {t("workshopConfirmServiceScreen.carDiagram.hint")}
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

        {/* RATING */}
        <View style={styles.ratingCard}>
          <Text style={styles.sectionTitle}>
            {t("workshopConfirmServiceScreen.rating")}
          </Text>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <FontAwesome
                  name={star <= rating ? "star" : "star-o"}
                  size={30}
                  color={star <= rating ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.starLabel,
                    star <= rating && styles.starLabelActive,
                  ]}
                >
                  {ratingLabels[star - 1]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== FOTOS ===== */}
        <InfiniteImageCarousel
          title={t("workshopConfirmServiceScreen.photos")}
          images={Array.from({ length: fotosServicoSlots }).map((_, i) => {
            const entry = fotosServicoEntries[i];
            if (entry?.uri) {
              return {
                localUri: resolveImageUri(entry.uri),
                label: entry.label,
                isPlaceholder: false,
                onPress: () => handleOpenImage(entry.uri)
              };
            } else {
              return {
                isPlaceholder: true,
                label: entry?.label
              };
            }
          })}
        />

        {/* ===== FOTOS DA PERÍCIA ===== */}
        {complete && (
          <InfiniteImageCarousel
            title={t("workshopConfirmServiceScreen.photosPericia")}
            images={Array.from({ length: fotosPericiaSlots }).map((_, i) => {
              const entry = fotosPericiaEntries[i];
              if (entry?.uri) {
                return {
                  localUri: resolveImageUri(entry.uri),
                  label: entry.label,
                  isPlaceholder: false,
                  onPress: () => handleOpenImage(entry.uri)
                };
              } else {
                return {
                  isPlaceholder: true,
                  label: entry?.label
                };
              }
            })}
          />
        )}

        {/* AÇÕES */}
        {isFinalizado && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              loadingConfirm && styles.buttonDisabled,
            ]}
            onPress={() => openConfirmModal("confirm")}
            disabled={loadingConfirm}
          >
            {loadingConfirm && (
              <ActivityIndicator size="small" color={colors.black} />
            )}
            <Text style={styles.confirmButtonText}>
              {loadingConfirm
                ? t("workshopConfirmServiceScreen.confirming")
                : t("workshopConfirmServiceScreen.confirm")}
            </Text>
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

      <ConfirmModal
        visible={confirmVisible}
        variant="double"
        type={confirmAction === "reject" ? "warning" : "success"}
        title={
          confirmAction === "reject"
            ? t("workshopConfirmServiceScreen.confirmRejectTitle")
            : t("workshopConfirmServiceScreen.confirmApproveTitle")
        }
        subtitle={
          confirmAction === "reject"
            ? t("workshopConfirmServiceScreen.confirmRejectSubtitle")
            : t("workshopConfirmServiceScreen.confirmApproveSubtitle")
        }
        confirmText={
          confirmAction === "reject"
            ? t("workshopConfirmServiceScreen.rejectService")
            : t("workshopConfirmServiceScreen.confirm")
        }
        cancelText={t("common.cancel")}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
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
    </View>
  );
}

const styles = StyleSheet.create({

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundBase,
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
    backgroundColor: colors.card_item,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
  },
  headerTitle: {
    fontSize: 22,
    color: colors.white,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  carCard: {
    backgroundColor: colors.card_item,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    gap: 12,
  },
  plateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  plate: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 1.5,
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  model: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  priceInput: {
    width: 110,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  input: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  techRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  techLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  techName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  ratingCard: {
    backgroundColor: colors.backgroundSurface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-around",
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
    borderWidth: 2,
    borderStyle: "dashed",
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
  // NOVOS ESTILOS PARA OS RÓTULOS DAS FOTOS
  photoLabelContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 4,
    alignItems: "center",
  },
  photoLabel: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "600",
  },
  rejectButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rejectButtonText: {
    color: "#ef4444",
    fontWeight: "800",
    fontSize: 15,
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
  buttonDisabled: {
    opacity: 0.7,
  },
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
    backgroundColor: "#0A0D12",
    borderWidth: 1,
    borderColor: "#1F242E",
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
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
});