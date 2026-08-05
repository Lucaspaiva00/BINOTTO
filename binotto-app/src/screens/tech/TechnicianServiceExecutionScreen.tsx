import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { colors } from "@/theme/colors";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import InfiniteImageCarousel from "@/components/common/InfiniteImageCarousel";
import { ErrorAlert } from "@/components/common/ErrorAlert";
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
import { PartInspection, RepairType } from "@/types/carParts";
import { REPAIR_COLORS } from "@/theme/repairColors";
import InspectionModal from "@/components/common/InspectionModal";
import { formatCurrency } from "@/utils/currency";
import { getStatusLabelKey } from "@/utils/status";
import { formatDate } from "@/utils/date";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import { GLOBAL } from "@/constants/global";
import LegendDot from "@/components/common/LegendDot";
import { colorStatus } from "@/services/ColorStatusService";
import {
  Calendar,
  Camera,
  Car,
  Euro,
  MessageSquare,
} from "lucide-react-native";
import InspectionModalVisualizer from "@/components/common/InspectionModalVisualizer";

type Photo =
  | { type: "existing"; uri: string }
  | { type: "new"; asset: ImagePicker.ImagePickerAsset }
  | null;

const storage = GLOBAL.storage;

export default function TechnicianServiceExecutionScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const serviceId = route.params?.serviceId;
  const backTo = route.params?.backTo;

  // states
  const [service, setService] = useState<any>(null);
  const [partsState, setPartsState] = useState(() => createInitialPartsState());
  const [partsStateInspection, setPartsStateInspection] = useState(() => createInitialPartsState());
  const [selectedPartIdInspection, setSelectedPartIdInspection] = useState<string | null>(null);
  const [modalInspectionVisible, setModalInspectionVisible] = useState<boolean>(false);
  const [visualizePartId, setVisualizePartId] = useState<string | null>(null);
  
  const [photosReparoToRemove, setPhotosReparoToRemove] = useState<
    { partId: string; path: string }[]
  >([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  // utils
  const [loading, setLoading] = useState<boolean>(false);
  const [submittingType, setSubmittingType] = useState<
    "save" | "finish" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [modalPartVisible, setModalPartVisible] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [inspectionVisible, setInspectionVisible] = useState<boolean>(false);

  const changedParts = useMemo(() => {
    return Object.entries(partsState)
      .filter(([, part]) => part.tipoReparo !== "SEM_DANO")
      .map(([partId, part]) => {
        const partInfo = CAR_PARTS.find((p) => p.id === partId);

        return {
          id: partId,
          nome: t(partInfo?.labelKey ?? partId),
          procedimento: t(`repairTypes.${part.tipoReparo}`),
          color: REPAIR_COLORS[part.tipoReparo],
          hasComment: !!part.observacoes?.trim(),
          hasPhotos: (part.fotos?.length ?? 0) > 0,
        };
      });
  }, [partsState, t]);

  // fotos
  const photosOficina = service?.fotos_oficina ?? [];
  const photosTecnico = service?.pericia_em_execucao?.fotos_tecnico
    ? (Object.values(service.pericia_em_execucao.fotos_tecnico) as string[])
    : [];
  const photosPericia = service?.pericia_em_execucao?.fotos_pericia
    ? (Object.values(service.pericia_em_execucao.fotos_pericia) as string[])
    : [];

  // functions
  const removeReparoPhoto = (partId: string, photo: Photo) => {
    if (!photo) return;

    if (photo.type === "existing") {
      const path = photo.uri.replace(`${storage}/`, "");

      setPhotosReparoToRemove((prev) => [...prev, { partId, path }]);
    }
  };

  const openPartModal = (id: string) => {
    setEditingPartId(id);
    setModalPartVisible(true);
  };

  const handleCloseInspectionModal = () => {
    setModalPartVisible(false);
    setEditingPartId(null);
  };

  const openPartModalVizualizer = (id: string) => {
    setVisualizePartId(id);
    setModalInspectionVisible(true);
  };

  const closePartModalVizualizer = () => {
    setModalInspectionVisible(false);
    setVisualizePartId(null);
  };

  const handleSavePartInspection = (data: PartInspection) => {
    if (!editingPartId) {
      return;
    }

    setPartsState((prev) => {
      const current = prev[editingPartId];

      return {
        ...prev,
        [editingPartId]: {
          ...current,
          ...data,
          fotos: data.fotos ?? current.fotos ?? [],
        },
      };
    });

    handleCloseInspectionModal();
  };

  const toggleApplyToAllParts = (tipo: RepairType) => {
    setPartsState((prev) => {
      const updated = { ...prev };
      const allSelected = Object.values(updated).every(
        (part) => part.tipoReparo === tipo,
      );
      Object.entries(updated).forEach(([id, part]) => {
        updated[id] = {
          ...part,
          tipoReparo: allSelected ? "SEM_DANO" : tipo,
        };
      });
      return updated;
    });
  };

  const buildFormData = (finalizar: boolean) => {
    const formData = new FormData();

    formData.append("finalizar", finalizar ? "1" : "0");

    // Informações do reparo
    const reparosExecucao = Object.entries(partsState).map(
      ([partId, part]) => ({
        peca: partId,
        tipoReparo: part.tipoReparo,
        quantidadeAmassados: part.quantidadeAmassados,
        tamanhoAmassado: part.tamanhoAmassado,
        coeficiente: part.coeficiente,
        observacoes: part.observacoes,
      }),
    );

    formData.append("reparos_execucao", JSON.stringify(reparosExecucao));

    // Fotos dos reparos
    Object.entries(partsState).forEach(([partId, part]) => {
      part.fotos?.forEach((photo, index) => {
        if (!photo || photo.type !== "new") return;

        formData.append(`fotos_reparo[${partId}][]`, {
          uri: photo.asset.uri,
          type: photo.asset.mimeType ?? "image/jpeg",
          name: photo.asset.fileName ?? `reparo_${partId}_${index}.jpg`,
        } as any);
      });
    });

    // Fotos para remover
    formData.append(
      "fotos_reparo_remover",
      JSON.stringify(photosReparoToRemove),
    );

    return formData;
  };

  const resetForm = () => {
    setPartsState(createInitialPartsState());
  };

  // requests
  const handleSaveProgress = async () => {
    try {
      setSubmittingType("save");

      const payload = buildFormData(false);

      await TechnicianManagementService.saveExecution(
        serviceId,
        payload,
        false,
      );

      await loadService();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianServiceExecutionScreen.submitError");

      setError(message);
    } finally {
      setSubmittingType(null);
    }
  };

  const handleFinishVehicle = async () => {
    try {
      setSubmittingType("finish");

      const payload = buildFormData(true);

      await TechnicianManagementService.saveExecution(serviceId, payload, true);

      await loadService();

      navigation.navigate("Dashboard", { tab: "completed" });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianServiceExecutionScreen.submitError");

      setError(message);
    } finally {
      setSubmittingType(null);
    }
  };

  const loadService = async () => {
    try {
      setLoading(true);

      const res = await TechnicianManagementService.getServiceById(serviceId);

      setService(res.data);
      setPartsState(
        normalizeReparos(res.data.primeiro_veiculo?.reparos_execucao ?? [])
      );
      setPartsStateInspection(
        normalizeReparos(res.data.pericia_em_execucao?.reparos_necessarios ?? [])
      )
    } catch (err) {
      setError(t("technicianServiceExecutionScreen.loadingServiceError"));
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
        onPress={() => {
          if (backTo) {
            navigation.navigate(backTo);
          } else {
            navigation.goBack();
          }
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: 0 }]}>
        {/* Header */}
        <AppHeader
          logo={require("@/assets/binotto-dog-logo-cropped.png")}
          title={t("technicianServiceDetailsScreen.title")}
          onBack={() => {
            if (backTo) {
              navigation.navigate(backTo);
            } else {
              navigation.goBack();
            }
          }}
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

              <View
                style={[
                  styles.badge,
                  {
                    borderLeftWidth: 0.3,
                    borderRightWidth: 0.3,
                    borderTopWidth: 0.3,
                    borderBottomWidth: 0.3,
                    backgroundColor: `${colorStatus(service.status, true)}20`,
                    borderColor:
                      colorStatus(service.status, true) ?? colors.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    ...styles.badgeText,
                    color: colorStatus(service.status, true),
                  }}
                >
                  {t(getStatusLabelKey(service.status, true))}
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

              <View style={styles.dateRow}>
                <Calendar size={12} color={colors.primary} />

                <Text style={styles.serviceDateText}>
                  {service?.data_inicio
                    ? formatDate(service.data_inicio)
                    : " --"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.inspectionContainer}>
            <TouchableOpacity
              style={styles.inspectionButton}
              onPress={() => {
                if(inspectionVisible){
                  setInspectionVisible(false)
                }else{
                  setInspectionVisible(true)
                }
              }}
            >
              <Text style={styles.inspectionButtonText}>
                { 
                  inspectionVisible ?
                  t("technicianServiceExecutionScreen.inspection.hide") : 
                  t("technicianServiceExecutionScreen.inspection.view")
                }
              </Text>
            </TouchableOpacity>

            {inspectionVisible && (
              <View style={styles.carMapCard}>
                <View style={styles.diagramWrap}>
                  <View style={styles.carFrame}>
                    <View style={[styles.wheel, styles.wheelFrontLeft]} />
                    <View style={[styles.wheel, styles.wheelFrontRight]} />
                    <View style={[styles.wheel, styles.wheelRearLeft]} />
                    <View style={[styles.wheel, styles.wheelRearRight]} />

                    <CarDiagram
                      partsState={partsStateInspection}
                      selectedPartId={selectedPartIdInspection}
                      setSelectedPartId={(id) => {
                        setSelectedPartIdInspection(id);
                        openPartModalVizualizer(id);
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

          </View>

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
                    openPartModal(id);
                  }}
                  canEdit={true}
                />
              </View>
            </View>

            <View style={styles.bulkActions}>
              <TouchableOpacity
                style={styles.bulkButtonPrimary}
                onPress={() => toggleApplyToAllParts("PDR")}
              >
                <Text style={styles.bulkButtonPrimaryText}>
                  {t("technicianServiceExecutionScreen.bulkActions.allPdr")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bulkButtonSecondary}
                onPress={() => toggleApplyToAllParts("PINTURA")}
              >
                <Text style={styles.bulkButtonSecondaryText}>
                  {t("technicianServiceExecutionScreen.bulkActions.allPaint")}
                </Text>
              </TouchableOpacity>
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

          {/* RESUMO DAS ALTERAÇÕES */}
          {changedParts.length > 0 && (
            <View>
              <Text style={styles.summaryTitle}>
                {t("technicianNewServiceScreen.changeSummary")}
              </Text>

              {changedParts.map((item) => (
                <View key={item.id} style={styles.summaryRow}>
                  <View
                    style={[
                      styles.procedureDot,
                      { backgroundColor: item.color },
                    ]}
                  />

                  <Text style={styles.summaryText}>{item.nome}</Text>

                  <Text style={styles.separator}>—</Text>

                  <Text style={styles.procedureText}>{item.procedimento}</Text>

                  {item.hasComment && (
                    <MessageSquare size={12} color={colors.textMuted} />
                  )}

                  {item.hasPhotos && (
                    <Camera size={12} color={colors.textMuted} />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* FOTOS DA OFICINA */}
          {photosOficina?.length > 0 && (
            <View style={styles.photoSection}>
              <Text style={styles.label}>
                {t("technicianServiceExecutionScreen.photos.workshop")}
              </Text>

              <View style={styles.grid}>
                {photosOficina.map((foto: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoBox}
                    onPress={() => {
                      setSelectedImage(`${storage}/${foto}`);
                      setViewerVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: `${storage}/${foto}` }}
                      style={styles.photo}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* FOTOS DO TECNICO */}
          {photosTecnico?.length > 0 && (
            <View style={styles.photoSection}>
              <Text style={styles.label}>
                {t("technicianServiceExecutionScreen.photos.technician")}
              </Text>

              <View style={styles.grid}>
                {photosTecnico.map((foto: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoBox}
                    onPress={() => {
                      setSelectedImage(`${storage}/${foto}`);
                      setViewerVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: `${storage}/${foto}` }}
                      style={styles.photo}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* FOTOS DA PERÍCIA */}
          {photosPericia?.length > 0 && (
            <InfiniteImageCarousel
              images={photosPericia}
              onImagePress={(uri) => {
                setSelectedImage(`${storage}/${uri}`);
                setViewerVisible(true);
              }}
              title={t("technicianServiceExecutionScreen.photos.inspection")}
              showIndicators={true}
            />
          )}

          <View style={styles.submitActions}>
            <TouchableOpacity
              disabled={submittingType !== null}
              style={[
                styles.saveProgressButton,
                submittingType && { opacity: 0.7 },
              ]}
              onPress={handleSaveProgress}
            >
              {submittingType === "save" ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.saveProgressButtonText}>
                  {t("technicianServiceExecutionScreen.actions.saveProgress")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={submittingType !== null}
              style={[
                styles.finishVehicleButton,
                submittingType && { opacity: 0.7 },
              ]}
              onPress={handleFinishVehicle}
            >
              {submittingType === "finish" ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.finishVehicleButtonText}>
                  {t("technicianServiceExecutionScreen.actions.finishVehicle")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {modalPartVisible && editingPartId && (
          <InspectionModal
            visible={modalPartVisible}
            partName={
              editingPartId
                ? t(
                    CAR_PARTS.find((part) => part.id === editingPartId)
                      ?.labelKey ?? "",
                  )
                : ""
            }
            value={
              editingPartId
                ? partsState[editingPartId]
                : createInitialPartsState()["capo"]
            }
            inspectionComplete={false}
            onClose={handleCloseInspectionModal}
            onSave={handleSavePartInspection}
            removeReparoPhoto={(photo) =>
              editingPartId && removeReparoPhoto(editingPartId, photo)
            }
          />
        )}

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
                ? partsStateInspection[visualizePartId]
                : createInitialPartsState()["capo"]
            }
            inspectionComplete={true}
            onClose={closePartModalVizualizer}
          />
        )}
      </View>

      <ImageViewerModal
        visible={viewerVisible}
        image={selectedImage}
        onClose={() => {
          setViewerVisible(false);
          setSelectedImage(null);
        }}
      />
    </KeyboardAvoidingView>
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

  content: {
    padding: 16,
    gap: 16,
  },

  label: {
    fontWeight: "500",
    color: colors.textMuted,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  inputStyle: {
    backgroundColor: colors.backgroundBase,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },

  section: {
    gap: 16,
  },

  // Carro
  bulkActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },

  bulkButtonPrimary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2F8BFF",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#0F1622",
  },

  bulkButtonPrimaryText: {
    color: "#2F8BFF",
    fontWeight: "600",
    fontSize: 13,
  },

  bulkButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#211B0A",
  },

  bulkButtonSecondaryText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },

  bulkButtonReset: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.text,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  bulkButtonResetText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 13,
  },

  carMapCard: {},

  carMapSubtitle: {
    color: colors.textMuted,
    marginBottom: 10,
    fontSize: 12,
  },

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

  submitActions: {
    flexDirection: "row",
    gap: 12,
  },

  saveProgressButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#2e2e2e",
    alignItems: "center",
    justifyContent: "center",
  },

  saveProgressButtonText: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15,
  },

  finishVehicleButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  finishVehicleButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 15,
  },

  // fotos
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

  photoCounter: {
    marginTop: 6,
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },

  summaryTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },

  procedureDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  summaryText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  separator: {
    color: colors.textMuted,
  },

  procedureText: {
    color: colors.textMuted,
    fontSize: 14,
  },

  inspectionContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#452165",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#22172a"
  },

  inspectionButton: {
    flex: 1,
    width: "100%",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center"
  },

  inspectionButtonText: {
    color: "#caa9ef",
    fontWeight: "600",
    fontSize: 13,
  },
});
