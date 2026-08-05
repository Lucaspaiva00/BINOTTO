import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import AppHeader from "@/components/common/AppHeader";
import { colors } from "@/theme/colors";
import "dayjs/locale/pt-br";
import { Input } from "@/components/common/Input";
import WorkshopManagementService from "@/services/WorkshopManagementService";
import { GLOBAL } from "@/constants/global";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/currency";
import { DateRangeInput } from "@/components/common/DateRangeInput";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import InfiniteImageCarousel from "@/components/common/InfiniteImageCarousel";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import dayjs from "dayjs";
import { CustomSwitch } from "@/components/common/CustomSwitch";
import PermissionController from "@/controllers/permission.controller";
import { createInitialPartsState, normalizeReparos, CAR_PARTS } from "@/utils/carParts";
import { optimizeImage } from "@/utils/images";
import CarDiagram from "@/components/common/CarDiagram";
import LegendDot from "@/components/common/LegendDot";
import { REPAIR_COLORS } from "@/theme/repairColors";
import InspectionModal from "@/components/common/InspectionModal";
import { RepairType } from "@/types/carParts";

type Photo =
  | { type: "existing"; uri: string }
  | { type: "new"; asset: ImagePicker.ImagePickerAsset }
  | null;

type DateRangeValue = {
  start: string | null;
  end: string | null;
};

const CURRENCY = "EUR";
const storage = GLOBAL.storage;

const PHOTO_TYPES = [
  "diagonalFrontDriver",
  "diagonalRearPassenger",
  "plateOrChassis",
  "workOrder",
] as const;

type StandardPhotoType = (typeof PHOTO_TYPES)[number];

const PHOTO_TYPES_INSPECTION = ["document", "km", "chassis"] as const;

type InspectionPhotoType = (typeof PHOTO_TYPES_INSPECTION)[number];

const defaultImages: Record<any, any> = {
  diagonalFrontDriver: require("@/assets/diagonal_dianteira.jpg"),
  diagonalRearPassenger: require("@/assets/diagonal_traseira.jpg"),
  plateOrChassis: require("@/assets/foto_placa.jpg"),
  workOrder: require("@/assets/ordem_servico.jpg"),
  document: require("@/assets/foto_chassi.jpg"),
  km: require("@/assets/foto_chassi.jpg"),
  chassis: require("@/assets/foto_chassi.jpg"),
};

export default function WorkshopServiceUpdateScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const serviceId = route.params?.serviceId;

  const [dateRange, setDateRange] = useState<DateRangeValue>({
    start: null,
    end: null,
  });
  const [quantity, setQuantity] = useState("1");
  const [observations, setObservations] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [unitType, setUnitType] = useState<"carros" | "dias">("carros");
  const [photos, setPhotos] = useState<Record<StandardPhotoType, Photo | null>>(
    {
      diagonalFrontDriver: null,
      diagonalRearPassenger: null,
      plateOrChassis: null,
      workOrder: null,
    }
  );
  const [showUnitSelect, setShowUnitSelect] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>("");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [inspectionData, setInspectionData] = useState({
    periciaCompleta: false,
  });

  const [partsState, setPartsState] = useState(() => createInitialPartsState());
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [modalPartVisible, setModalPartVisible] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);

  const [photosPericiaCompleta, setPhotosPericiaCompleta] = useState<
    Record<string, Photo | null>
  >({
    document: null,
    km: null,
    chassis: null,
  });

  const handleToggleFullInspection = (value: boolean) => {
    setInspectionData((prev) => ({ ...prev, periciaCompleta: value }));
    setPartsState(createInitialPartsState());
    if (value) {
      setTotalValue("");
    }
  };

  const toggleApplyToAllParts = (tipo: RepairType) => {
    setPartsState((prev) => {
      const updated = { ...prev };
      const allSelected = Object.values(updated).every(
        (part) => part.tipoReparo === tipo
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

  const openPartModal = (id: string) => {
    setEditingPartId(id);
    setModalPartVisible(true);
  };

  const handleCloseInspectionModal = () => {
    setModalPartVisible(false);
    setEditingPartId(null);
  };

  const handleSavePartInspection = (data: any) => {
    if (!editingPartId) return;
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

  const PHOTO_LABEL: Record<StandardPhotoType, string> = {
    diagonalFrontDriver: t(
      "workshopServiceUpdateScreen.photosLabels.diagonalFrontDriver"
    ),
    diagonalRearPassenger: t(
      "workshopServiceUpdateScreen.photosLabels.diagonalRearPassenger"
    ),
    plateOrChassis: t(
      "workshopServiceUpdateScreen.photosLabels.plateOrChassis"
    ),
    workOrder: t("workshopServiceUpdateScreen.photosLabels.workOrder"),
  };

  const PHOTO_INSPECTION_LABELS: Record<InspectionPhotoType, string> = {
    document: t("workshopServiceUpdateScreen.inspectionPhotosLabels.document"),
    km: t("workshopServiceUpdateScreen.inspectionPhotosLabels.km"),
    chassis: t("workshopServiceUpdateScreen.inspectionPhotosLabels.chassis"),
  };

  const handleTakePhoto = async (
    type: StandardPhotoType | InspectionPhotoType,
    inspectionPhoto: boolean = false
  ) => {
    PermissionController.checkCameraPermission(navigation, async () => {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });
      if (!result.canceled) {
        const optimizedAsset = await optimizeImage(result.assets[0]);
        const photo: Photo = { type: "new", asset: optimizedAsset };

        if (inspectionPhoto) {
          setPhotosPericiaCompleta((prev) => ({ ...prev, [type]: photo }));
        } else {
          setPhotos((prev) => ({ ...prev, [type]: photo }));
        }
      }
    });
  };

  const removePhoto = (
    type: StandardPhotoType | InspectionPhotoType,
    inspectionPhoto: boolean = false
  ) => {
    if (inspectionPhoto) {
      setPhotosPericiaCompleta((prev) => ({ ...prev, [type]: null }));
      return;
    }

    setPhotos((prev) => ({ ...prev, [type]: null }));
  };

  const handleOpenImage = (photo: Photo) => {
    if (!photo) return;
    if (photo.type === "existing") {
      setSelectedImage(photo.uri);
    } else if (photo.type === "new") {
      setSelectedImage(photo.asset.uri);
    }
    setViewerVisible(true);
  };

  const resetForm = () => {
    setDateRange({ start: null, end: null });
    setQuantity("1");
    setObservations("");
    setTotalValue("");
    setUnitType("carros");
    setPhotos({
      diagonalFrontDriver: null,
      diagonalRearPassenger: null,
      plateOrChassis: null,
      workOrder: null,
    });
    setShowUnitSelect(false);
    setLoading(false);
    setError(null);
    setInspectionData({ periciaCompleta: false });
    setPartsState(createInitialPartsState());
    setPhotosPericiaCompleta({
      document: null,
      km: null,
      chassis: null,
    });
  };

  const loadService = async () => {
    try {
      setLoading(true);
      const res = await WorkshopManagementService.getServiceById(serviceId);
      const service = res.data;

      if (service.data_inicio || service.data_fim) {
        setDateRange({
          start: service.data_inicio || null,
          end: service.data_fim || null,
        });
      }

      setQuantity(service.quantidade?.toString() || "1");
      setObservations(service.observacoes || "");
      setTotalValue(service.valor_total ? String(Number(service.valor_total) * 100) : "");
      setUnitType(service.quantidade_tipo || "carros");

      if (service.fotos) {
        const loadedPhotos: Record<StandardPhotoType, Photo | null> = {
          diagonalFrontDriver: null,
          diagonalRearPassenger: null,
          plateOrChassis: null,
          workOrder: null,
        };
        PHOTO_TYPES.forEach((type) => {
          const path = service.fotos[type];
          if (path) {
            loadedPhotos[type] = {
              type: "existing",
              uri: path.startsWith("http") ? path : `${storage}/${path}`,
            };
          }
        });
        setPhotos(loadedPhotos);
      }

    if (service.fotos_pericia_completa) {
        const loaded: Record<string, Photo | null> = {
          document: null,
          km: null,
          chassis: null,
        };
        ['document', 'km', 'chassis'].forEach((type) => {
          const path = service.fotos_pericia_completa[type];
          if (path) {
            loaded[type] = {
              type: "existing",
              uri: path.startsWith("http") ? path : `${storage}/${path}`,
            };
          }
        });
        setPhotosPericiaCompleta(loaded);
      }

      setInspectionData({
        periciaCompleta: !!service.pericia_completa,
      });

      if (service.reparos_necessarios && Array.isArray(service.reparos_necessarios)) {
        const newPartsState = createInitialPartsState();

        const normalized = normalizeReparos(service.reparos_necessarios);

        const reparosArray = Array.isArray(normalized) ? normalized : service.reparos_necessarios;

        reparosArray.forEach((reparo: any) => {
          const peca = reparo.peca;
          if (newPartsState[peca]) {
            newPartsState[peca] = {
              ...newPartsState[peca],
              tipoReparo: reparo.tipoReparo || 'SEM_DANO',
              quantidadeAmassados: reparo.quantidadeAmassados || 0,
              quantidadeImpactosMaior25: reparo.quantidadeImpactosMaior25 || 0,
              quantidadeImpactosMenor25: reparo.quantidadeImpactosMenor25 || 0,
              tamanhoAmassado: reparo.tamanhoAmassado || null,
              coeficiente: reparo.coeficiente || 0,
              observacoes: reparo.observacoes || '',
              fotos: [], 
            };
          }
        });

        if (service.fotos_reparos && typeof service.fotos_reparos === 'object') {
          Object.entries(service.fotos_reparos).forEach(([peca, caminhos]) => {
            if (Array.isArray(caminhos) && newPartsState[peca]) {
              newPartsState[peca].fotos = caminhos.map((caminho: string) => ({
                type: "existing",
                uri: caminho.startsWith("http") ? caminho : `${storage}/${caminho}`,
              }));
            }
          });
        }

        setPartsState(newPartsState);
      } else {
        setPartsState(createInitialPartsState());
      }

    } catch (err) {
      setError(t("workshopServiceUpdateScreen.loadServiceError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);

      if (!dateRange.start) {
        setError(t("workshopServiceUpdateScreen.missingDateRangeError"));
        return;
      }

      setLoading(true);

      const formData = new FormData();

      const payload = {
        data_inicio: dateRange.start,
        data_fim: dateRange.end ?? dateRange.start,
        quantidade_tipo: unitType,
        quantidade: quantity,
        moeda: CURRENCY,
        valor_total: totalValue ? (Number(totalValue) / 100).toFixed(2) : "",
        pericia_completa: inspectionData.periciaCompleta ? "1" : "0",
        observacoes: observations,
      };

      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });

      Object.entries(photos).forEach(([type, photo]) => {
        if (!photo || photo.type !== "new") return;
        formData.append(`fotos[${type}]`, {
          uri: photo.asset.uri,
          type: photo.asset.mimeType ?? "image/jpeg",
          name: photo.asset.fileName ?? `${type}.jpg`,
        } as any);
      });

      if (inspectionData.periciaCompleta) {
        Object.entries(photosPericiaCompleta).forEach(([type, photo]) => {
          if (!photo || photo.type !== "new") return;
          formData.append(`fotos_pericia_completa[${type}]`, {
            uri: photo.asset.uri,
            type: photo.asset.mimeType ?? "image/jpeg",
            name: photo.asset.fileName ?? `${type}.jpg`,
          } as any);
        });
      }

      const reparosNecessarios = Object.entries(partsState).map(
        ([partId, part]) => ({
          peca: partId,
          tipoReparo: part.tipoReparo,
          quantidadeAmassados: part.quantidadeAmassados,
          quantidadeImpactosMaior25: part.quantidadeImpactosMaior25,
          quantidadeImpactosMenor25: part.quantidadeImpactosMenor25,
          tamanhoAmassado: part.tamanhoAmassado,
          coeficiente: part.coeficiente,
          observacoes: part.observacoes,
        })
      );
      
      formData.append("reparos_necessarios", JSON.stringify(reparosNecessarios));

      Object.entries(partsState).forEach(([partId, part]) => {
        part.fotos?.forEach((photo, index) => {
          if (!photo || photo.type !== "new") return;
          formData.append(`fotos_reparos[${partId}][]`, {
            uri: photo.asset.uri,
            type: photo.asset.mimeType ?? "image/jpeg",
            name: photo.asset.fileName ?? `reparo_${partId}_${index}.jpg`,
          } as any);
        });
      });

      await WorkshopManagementService.updateWorkshopService(serviceId, formData);
      navigation.goBack();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("workshopServiceUpdateScreen.submitError");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        resetForm();
        await loadService();
      };
      init();
    }, [serviceId, locale])
  );

  useEffect(() => {
    if (unitType === "carros") {
      setQuantity("1");
    } else {
      setQuantity("");
    }
  }, [unitType]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader
          logo={require("@/assets/binotto-dog-logo-cropped.png")}
          title={t("workshopServiceUpdateScreen.title")}
          onBack={() => navigation.goBack()}
        />
        {error && (
          <View style={{ marginVertical: 16, marginHorizontal: 20 }}>
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.surfaceSection}>
            <View style={styles.switchRow}>
              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <Text style={{ color: colors.white, fontSize: 16 }}>
                  {t("workshopServiceUpdateScreen.inspectionLabel")}
                </Text>
                <Text style={{ color: colors.white, fontSize: 16 }}>
                  {t("workshopServiceUpdateScreen.basicLabel")}
                </Text>
              </View>

              <CustomSwitch
                value={inspectionData.periciaCompleta}
                onValueChange={handleToggleFullInspection}
                activeColor={colors.primary}
                inactiveColor={colors.border}
              />

              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <Text style={{ color: colors.white, fontSize: 16 }}>
                  {t("workshopServiceUpdateScreen.inspectionLabel")}
                </Text>
                <Text style={{ color: colors.white, fontSize: 16 }}>
                  {t("workshopServiceUpdateScreen.completeLabel")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <DateRangeInput
              label={t("workshopServiceUpdateScreen.date")}
              buttonText={t("common.confirm")}
              placeholder={t("workshopServiceUpdateScreen.datePlaceholder")}
              value={dateRange}
              onChange={setDateRange}
              minimumDate={dayjs().format("YYYY-MM-DD")}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>
                {t("workshopServiceUpdateScreen.quantity")}
              </Text>
            </View>
            <View style={styles.quantityWrapper}>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={styles.selectButton}
                  activeOpacity={0.8}
                  onPress={() => setShowUnitSelect((v) => !v)}
                >
                  <Text style={styles.selectButtonText}>
                    {unitType === "carros"
                      ? t("workshopServiceUpdateScreen.cars")
                      : t("workshopServiceUpdateScreen.days")}
                  </Text>
                  <MaterialCommunityIcons
                    name={showUnitSelect ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {showUnitSelect && (
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        unitType === "carros" && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setUnitType("carros");
                        setShowUnitSelect(false);
                      }}
                    >
                      <View style={styles.dropdownContent}>
                        {unitType === "carros" && (
                          <MaterialCommunityIcons
                            name="check"
                            size={18}
                            color={colors.text}
                          />
                        )}
                        <Text style={styles.dropdownText}>
                          {t("workshopServiceUpdateScreen.cars")}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        unitType === "dias" && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setUnitType("dias");
                        setShowUnitSelect(false);
                      }}
                    >
                      <View style={styles.dropdownContent}>
                        {unitType === "dias" && (
                          <MaterialCommunityIcons
                            name="check"
                            size={18}
                            color={colors.text}
                          />
                        )}
                        <Text style={styles.dropdownText}>
                          {t("workshopServiceUpdateScreen.days")}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.quantityInputContainer,
                  unitType === "carros" && { opacity: 0.6 },
                ]}
              >
                <Input
                  keyboardType="numeric"
                  value={quantity}
                  editable={unitType !== "carros"}
                  placeholder={t(
                    "workshopServiceUpdateScreen.quantityPlaceholder"
                  )}
                  onChangeText={(text) => {
                    const onlyNumbers = text.replace(/[^0-9]/g, "");
                    setQuantity(onlyNumbers);
                  }}
                />
              </View>
            </View>
          </View>

           <View style={styles.section}>
            <InfiniteImageCarousel
              title={t("workshopServiceUpdateScreen.photos")}
              images={PHOTO_TYPES.map((type) => {
                const photo = photos[type];
                const label = PHOTO_LABEL[type];

                if (photo) {
                  return {
                    id: type,
                    label,
                    isPlaceholder: false,
                    uri: photo.type === "new" ? undefined : photo.uri,
                    localUri: photo.type === "new" ? photo.asset.uri : undefined,
                    onPress: () => handleOpenImage(photo),
                    onDelete: () => removePhoto(type),
                    onEdit: () => handleTakePhoto(type),
                  };
                } else {
                  return {
                    id: type,
                    label,
                    isPlaceholder: true,
                    placeholderSource: defaultImages[type],
                    onEdit: () => handleTakePhoto(type),
                  };
                }
              })}
            />
          </View>

          {inspectionData.periciaCompleta && (
            <View style={styles.section}>
              <Text style={styles.label}>
                {t("workshopServiceUpdateScreen.inspectionPhotosTitle")}
              </Text>
              <InfiniteImageCarousel
                images={PHOTO_TYPES_INSPECTION.map((type) => {
                  const photo = photosPericiaCompleta[type];
                  const label = PHOTO_INSPECTION_LABELS[type];

                  if (photo) {
                    return {
                      id: type,
                      label,
                      isPlaceholder: false,
                      uri: photo.type === "new" ? undefined : photo.uri,
                      localUri: photo.type === "new" ? photo.asset.uri : undefined,
                      onPress: () => handleOpenImage(photo),
                      onDelete: () => removePhoto(type, true),
                      onEdit: () => handleTakePhoto(type, true),
                    };
                  } else {
                    return {
                      id: type,
                      label,
                      isPlaceholder: true,
                      placeholderSource: defaultImages[type],
                      onEdit: () => handleTakePhoto(type, true),
                    };
                  }
                })}
              />
            </View>
          )}

          {!inspectionData.periciaCompleta && (
            <View style={styles.section}>
              <Text style={[styles.label, { marginBottom: 8 }]}>
                {t("workshopServiceUpdateScreen.value", { currency: CURRENCY })}
              </Text>
              <Input
                keyboardType="numeric"
                value={formatCurrencyInput(totalValue, locale)}
                onChangeText={(text) => {
                  setTotalValue(parseCurrencyInput(text));
                }}
              />
            </View>
          )}

          {/* Diagrama do carro e legenda */}
          <View style={styles.carMapCard}>
            {!inspectionData.periciaCompleta && (
              <View style={styles.bulkActions}>
                <TouchableOpacity
                  style={styles.bulkButtonPrimary}
                  onPress={() => toggleApplyToAllParts("PDR")}
                >
                  <Text style={styles.bulkButtonPrimaryText}>
                    {t("workshopServiceUpdateScreen.allPdr")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bulkButtonSecondary}
                  onPress={() => toggleApplyToAllParts("PINTURA")}
                >
                  <Text style={styles.bulkButtonSecondaryText}>
                    {t("workshopServiceUpdateScreen.allPaint")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
              <LegendDot color={REPAIR_COLORS.PDR} label={t("repairTypes.PDR")} />
              <LegendDot color={REPAIR_COLORS.PINTURA} label={t("repairTypes.PINTURA")} />
              <LegendDot color={REPAIR_COLORS.TROCA} label={t("repairTypes.TROCA")} />
              <LegendDot color={REPAIR_COLORS.ALUMINIO_PDR} label={t("repairTypes.ALUMINIO_PDR")} />
              <LegendDot color={REPAIR_COLORS.ALUMINIO_PINTURA} label={t("repairTypes.ALUMINIO_PINTURA")} />
              <LegendDot color={REPAIR_COLORS.SEM_DANO} label={t("repairTypes.SEM_DANO")} />
            </View>
          </View>

          <View style={styles.section}>
            <Input
              label={t("workshopServiceUpdateScreen.additionalNotes")}
              multiline
              placeholder={t("workshopServiceUpdateScreen.additionalNotes")}
              value={observations}
              onChangeText={setObservations}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.buttonSubmit,
              loading && styles.buttonSubmitDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading && <ActivityIndicator size="small" color={colors.black} />}
            <Text style={styles.buttonSubmitText}>
              {loading
                ? t("workshopServiceUpdateScreen.updating")
                : inspectionData.periciaCompleta
                ?t("workshopServiceUpdateScreen.saveAndUpdate") 
                : t("workshopServiceUpdateScreen.update")}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ImageViewerModal
          visible={viewerVisible}
          image={selectedImage}
          onClose={() => {
            setViewerVisible(false);
            setSelectedImage(null);
          }}
        />

        {modalPartVisible && editingPartId && (
          <InspectionModal
            visible={modalPartVisible}
            partName={
              editingPartId
                ? t(
                    CAR_PARTS.find((part) => part.id === editingPartId)
                      ?.labelKey ?? ""
                  )
                : ""
            }
            value={
              editingPartId
                ? partsState[editingPartId]
                : createInitialPartsState()["capo"]
            }
            inspectionComplete={inspectionData.periciaCompleta}
            onClose={handleCloseInspectionModal}
            onSave={handleSavePartInspection}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  label: {
    fontWeight: "500",
    color: colors.textMuted,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  surfaceSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    backgroundColor: colors.card_item,
  },
  quantityWrapper: {
    flexDirection: "row",
    gap: 10,
    zIndex: 20,
  },
  quantityInputContainer: {
    flex: 1,
  },
  selectContainer: {
    width: 140,
    position: "relative",
  },
  selectButton: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectButtonText: {
    color: colors.text,
    fontWeight: "500",
  },
  dropdown: {
    position: "absolute",
    top: 62,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    zIndex: 999,
    elevation: 10,
    padding: 8,
  },
  dropdownItem: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "500",
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownItemActive: {
    backgroundColor: colors.surface,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoContainer: {
    width: "31%",
    alignItems: "center",
  },
  photoBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  photoLabelOverlay: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  removePhoto: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  carMapCard: {
    borderRadius: 14,
    padding: 12,
  },
  bulkActions: {
    flexDirection: "row",
    gap: 10,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  buttonSubmit: {
    marginTop: 10,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  buttonSubmitText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonSubmitDisabled: {
    opacity: 0.7,
  },
});