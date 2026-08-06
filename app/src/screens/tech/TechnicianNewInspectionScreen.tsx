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
  ImageBackground,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import * as ImagePicker from "expo-image-picker";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/common/AppHeader";
import CarDiagram from "@/components/common/CarDiagram";
import {
  CAR_PARTS,
  createInitialPartsState,
  normalizeReparos,
} from "@/utils/carParts";
import { PartInspection, Photo, RepairType } from "@/types/carParts";
import { REPAIR_COLORS } from "@/theme/repairColors";
import InspectionModal from "@/components/common/InspectionModal";
import { InspectionData } from "@/types/inspection";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Input } from "@/components/common/Input";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/currency";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import InfiniteImageCarousel from "@/components/common/InfiniteImageCarousel";
import LegendDot from "@/components/common/LegendDot";
import { Select } from "@/components/common/Select";
import WorkshopService from "@/services/WorkshopService";
import TechnicianInspectionService from "@/services/TechnicianInspectionService";
import { CustomSwitch } from "@/components/common/CustomSwitch";
import { Camera, Eye, EyeOff, MessageSquare } from "lucide-react-native";
import PermissionController from "@/controllers/permission.controller";
import { GLOBAL } from "@/constants/global";
import { optimizeImage } from "@/utils/images";
import TechnicianManagementService from "@/services/TechnicianManagementService";

const diagonalDianteira = require("@/assets/diagonal_dianteira.jpg");
const diagonalTraseira = require("@/assets/diagonal_traseira.jpg");
const fotoChassi = require("@/assets/foto_chassi.jpg");
const fotoPlaca = require("@/assets/foto_placa.jpg");
const ordemServico = require("@/assets/ordem_servico.jpg");

const defaultImages: Record<PhotoType, any> = {
  diagonalFrontDriver: diagonalDianteira,
  diagonalRearPassenger: diagonalTraseira,
  plateOrChassis: fotoPlaca,
  chassis: fotoChassi,
  workOrder: ordemServico,
  document: fotoChassi,
  km: fotoChassi,
};

const PHOTO_TYPES_INSPECTION = ["document", "km", "chassis"] as const;
const PHOTO_TYPES = [
  "diagonalFrontDriver", 
  "diagonalRearPassenger",
  "plateOrChassis",
  "workOrder",
] as const;

type StandardPhotoType = (typeof PHOTO_TYPES)[number];
type InspectionPhotoType = (typeof PHOTO_TYPES_INSPECTION)[number];
type TechnicianPhotoLabels = Record<StandardPhotoType, string>;
type InspectionPhotoLabels = Record<InspectionPhotoType, string>;
type PhotoType = StandardPhotoType | InspectionPhotoType;

const storage = GLOBAL.storage;

export default function TechnicianNewInspectionScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();

  // states
  const [workshops, setWorkshops] = useState<any>(null);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<
    string | number | null
  >(null);
  const [inspectionData, setInspectionData] = useState<any>({
    placa: "",
    chassi: "",
    marcaModelo: "",
    inserirValor: false,
    moeda: "EUR",
    precoTotal: "0",
    valorPericia: "0",
  });
  const [partsState, setPartsState] = useState(() => createInitialPartsState());
  const [photos, setPhotos] = useState<
    Record<string, Photo | null>
  >({
    diagonalFrontDriver: null,
    diagonalRearPassenger: null,
    plateOrChassis: null,
    workOrder: null,
  });

  const [photosPericiaCompleta, setPhotosPericiaCompleta] = useState<
    Record<string, Photo | null>
  >({
    document: null,
    km: null,
    chassis: null,
  });
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  // utils
  const [loadingCreateInspection, setLoadingCreateInspection] = useState<boolean>(false);
  const [loadingStartCar, setLoadingStartCar] = useState<boolean>(false);
  const [workshopLoading, setWorkshopLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalPartVisible, setModalPartVisible] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isSubmitting = loadingStartCar || loadingCreateInspection;

  // constants
  const PHOTO_LABEL: TechnicianPhotoLabels = {
    diagonalFrontDriver: t(
      "technicianNewServiceScreen.photosTechnicianLabel.diagonalFrontDriver",
    ),
    diagonalRearPassenger: t(
      "technicianNewServiceScreen.photosTechnicianLabel.diagonalRearPassenger",
    ),
    plateOrChassis: t("technicianNewServiceScreen.photosTechnicianLabel.plateOrChassis"),
    workOrder: t("technicianNewServiceScreen.photosTechnicianLabel.workOrder"),
  };

  const PHOTO_INSPECTION_LABELS: InspectionPhotoLabels = {
    document: t("technicianNewServiceScreen.photosInpectionLabels.document"),
    km: t("technicianNewServiceScreen.photosInpectionLabels.km"),
    chassis: t("technicianNewServiceScreen.photosInpectionLabels.chassis"),
  };

  const workshopOptions =
    workshops?.map((workshop: any) => ({
      label: workshop.nome_fantasia ?? workshop.razao_social,
      value: workshop.id,
    })) ?? [];

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

  const photoLabels = [
    t("technicianNewInspectionScreen.photosLabels.document"),
    t("technicianNewInspectionScreen.photosLabels.km"),
    t("technicianNewInspectionScreen.photosLabels.chassis"),
  ];

  // functions
  const handleOpenImage = (photo: Photo) => {
    if (!photo) return;

    if (photo.type === "new") {
      setSelectedImage(photo.asset.uri);
    } else {
      setSelectedImage(photo.uri);
    }

    setViewerVisible(true);
  };

  const handleTakePhoto = async (type: PhotoType, inspectionPhoto: boolean = false) => {
    PermissionController.checkCameraPermission(navigation,async ()=>{
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled) return;

      const optimizedAsset = await optimizeImage(result.assets[0]); 

      const photo: Photo = {
        type: "new",
        asset: optimizedAsset,
      };

      if (inspectionPhoto) {
        setPhotosPericiaCompleta((prev) => ({
          ...prev,
          [type]: photo,
        }));
      } else {
        setPhotos((prev) => ({
          ...prev,
          [type]: photo,
        }));
      }
    });
  };

  const removePhoto = (type: PhotoType, inspectionPhoto: boolean = false) => {
    if (inspectionPhoto) {
      setPhotosPericiaCompleta((prev) => ({
        ...prev,
        [type]: null,
      }));
    } else {
      setPhotos((prev) => ({
        ...prev,
        [type]: null,
      }));
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

  const handleSavePartInspection = (data: PartInspection) => {
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

  const handleToggleFullInspection = (value: boolean) => {
    setInspectionData((prev: any) => ({
      ...prev,
      periciaCompleta: value,
      valorPericia: value ? prev.valorPericia : "0",
      precoSugerido: value ? "0" : prev.precoSugerido,
    }));

    setPartsState(() => createInitialPartsState());
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

  const buildFormData = () => {
    const periciaCompleta = inspectionData.periciaCompleta;

    const formData = new FormData();

    formData.append("oficina_id", String(selectedWorkshopId));
    formData.append("placa", inspectionData.placa?.trim() ?? "");
    formData.append("chassi", inspectionData.chassi?.trim() ?? "");
    formData.append("marca_modelo", inspectionData.marcaModelo?.trim() ?? "");
    formData.append("tipo", periciaCompleta ? "completa" : "simples");

    if (!periciaCompleta && inspectionData.inserirValor) {
      formData.append(
        "preco_sugerido",
        String((Number(inspectionData.precoSugerido) / 100).toFixed(2)),
      );
    }

    if (periciaCompleta && inspectionData.inserirValor) {
      formData.append(
        "valor_pericia",
        String((Number(inspectionData.valorPericia) / 100).toFixed(2)),
      );
    }

    Object.entries(photos).forEach(([type, photo]) => {
      if (!photo || photo.type !== "new") return;
      formData.append(`fotos[${type}]`, {
        uri: photo.asset.uri,
        type: photo.asset.mimeType ?? "image/jpeg",
        name: photo.asset.fileName ?? `${type}.jpg`,
      } as any);
    });

    if (periciaCompleta) {
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
      }),
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

    return formData;
  };

  const resetForm = () => {
    setInspectionData({
      placa: "",
      chassi: "",
      marcaModelo: "",
      periciaCompleta: false,
      inserirValor: false,
      precoSugerido: "0",
      valorPericia: "0",
    });

    setPhotos({
      diagonalFrontDriver: null,
      diagonalRearPassenger: null,
      plateOrChassis: null,
      workOrder: null,
    });

    setPhotosPericiaCompleta({
      document: null,
      km: null,
      chassis: null,
    });

    setPartsState(() => createInitialPartsState());
    setWorkshopLoading(false);
    setError(null);
    setSelectedWorkshopId(null);
    setSelectedPartId(null);
    setPartsState(createInitialPartsState());
  };

  // requests
  const handleStartCar = async () => {
    try {
      setError(null);

      if (!selectedWorkshopId) {
        setError(t("technicianNewServiceScreen.missingWorkshopError"));
        return;
      }

      if (
        !inspectionData.placa.trim() ||
        !inspectionData.chassi.trim() ||
        !inspectionData.marcaModelo.trim()
      ) {
        setError(t("technicianNewServiceScreen.missingVehicleInfoError"));
        return;
      }

      setLoadingStartCar(true);

      const payload = buildFormData();
      await TechnicianManagementService.startCar(payload);

      navigation.navigate("Dashboard");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianNewServiceScreen.submitError");

      setError(message);
    } finally {
      setLoadingStartCar(false);
    }
  };

  const handleCreateInspection = async () => {
    try {
      setError(null);

      if (!selectedWorkshopId) {
        setError(t("technicianNewServiceScreen.missingWorkshopError"));
        return;
      }

      if (
        !inspectionData.placa.trim() ||
        !inspectionData.chassi.trim() ||
        !inspectionData.marcaModelo.trim()
      ) {
        setError(t("technicianNewServiceScreen.missingVehicleInfoError"));
        return;
      }

      setLoadingCreateInspection(true);

      const periciaCompleta = inspectionData.periciaCompleta;

      const payload = buildFormData();

      if (periciaCompleta) {
          await TechnicianInspectionService.createCompleteInspection(payload);
      } else {
          await TechnicianInspectionService.createBasicInspection(payload);
      }

      navigation.navigate("Inspections");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianNewInspectionScreen.submitError");

      setError(message);
    } finally {
      setLoadingCreateInspection(false);
    }
  };

  const loadWorkshops = async () => {
    try {
      setWorkshopLoading(true);
      setError(null);

      const res = await WorkshopService.getWorkshops();

      setWorkshops(res.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianNewServiceScreen.loadWorkshopError");

      setError(message);
    } finally {
      setWorkshopLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      resetForm();
      loadWorkshops();
    }, []),
  );

  if (workshopLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
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
          title={t("technicianNewInspectionScreen.title")}
          onBack={() => navigation.goBack()}
        />

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        <ScrollView contentContainerStyle={styles.content}>
          {/* FORM */}
          <View style={styles.section}>
            <Select
              label={t("technicianNewServiceScreen.workshopLabel")}
              placeholder={t(
                "technicianNewServiceScreen.workshopSelectPlaceholder",
              )}
              colorText={colors.white}
              value={selectedWorkshopId ?? null}
              options={workshopOptions}
              onChange={(value) => {
                setSelectedWorkshopId(value);
              }}
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <InfiniteImageCarousel
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

          <View style={styles.surfaceSection}>
            <View style={styles.switchRow}>
              <View style={{flexDirection: "column", alignItems: "center"}}>
                <Text style={{ color: colors.white, fontSize: 16 }}>
                  {t("common.inspection")}
                </Text>
                <Text style={{ color: colors.white, fontSize: 16 }}>
                  {t("common.basic")}
                </Text>
              </View>

              <CustomSwitch
                value={inspectionData.periciaCompleta}
                onValueChange={(value) => {
                  handleToggleFullInspection(value);
                }}
                activeColor={colors.primary}
                inactiveColor={colors.border}
              />

              <View style={{flexDirection: "column", alignItems: "center"}}>
                <Text style={{ color: colors.white, fontSize: 16 }}>
                  {t("common.inspection")}
                </Text>
                <Text style={{ color: colors.white, fontSize: 16 }}>
                  {t("common.complete")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.surfaceSection}>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Input
                  colorText={colors.white}
                  label={t("technicianNewServiceScreen.plateLabel")}
                  autoCapitalize="characters"
                  value={inspectionData.placa}
                  placeholder="ABC1D23"
                  onChangeText={(text) =>
                    setInspectionData((prev: any) => ({
                      ...prev,
                      placa: text,
                    }))
                  }
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t("technicianNewServiceScreen.chassisLabel")}
                  colorText={colors.white}
                  autoCapitalize="characters"
                  value={inspectionData.chassi}
                  placeholder="VT004251"
                  onChangeText={(text) =>
                    setInspectionData((prev: any) => ({
                      ...prev,
                      chassi: text,
                    }))
                  }
                  style={styles.input}
                />
              </View>
            </View>
            <Input
              label={t("technicianNewServiceScreen.modelLabel")}
              placeholder="Volkswagen Gol"
              value={inspectionData.marcaModelo}
              onChangeText={(text) =>
                setInspectionData((prev: any) => ({
                  ...prev,
                  marcaModelo: text,
                }))
              }
              colorText={colors.white}
              style={styles.input}
            />
          </View>

          {/* FOTOS DA PERÍCIA COMPLETA */}
          {inspectionData.periciaCompleta && (
            <View style={styles.section}>
              <View style={{ ...styles.rowBetween}}>
                <Text style={styles.label}>
                  {t("technicianNewServiceScreen.inspectionPhotosLabel")}
                </Text>
              </View>

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

          <View style={styles.carMapCard}>
            {!inspectionData.periciaCompleta && (
              <View style={styles.bulkActions}>
                <TouchableOpacity
                  style={styles.bulkButtonPrimary}
                  onPress={() => toggleApplyToAllParts("PDR")}
                >
                  <Text style={styles.bulkButtonPrimaryText}>
                    {t("technicianNewServiceScreen.allPdr")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bulkButtonSecondary}
                  onPress={() => toggleApplyToAllParts("PINTURA")}
                >
                  <Text style={styles.bulkButtonSecondaryText}>
                    {t("technicianNewServiceScreen.allPaint")}
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

          <View style={styles.surfaceSection}>
            <View style={{ ...styles.switchRow, marginBottom: 16 }}>
              <Text style={styles.switchLabel}>
                {inspectionData.periciaCompleta
                  ? t("technicianNewServiceScreen.inspectionValueLabel")
                  : t("technicianNewServiceScreen.suggestedPriceLabel")}
              </Text>
              
              <CustomSwitch
                value={inspectionData.inserirValor}
                onValueChange={(value) => {
                  setInspectionData((prev: any) => ({
                    ...prev,
                    inserirValor: value,
                  }));
                }}
                activeColor={colors.primary}
                inactiveColor={colors.border}
              />
            </View>

            {inspectionData.inserirValor ? (
              <Input
                keyboardType="numeric"
                value={formatCurrencyInput(
                  inspectionData.periciaCompleta
                    ? inspectionData.valorPericia
                    : inspectionData.precoSugerido,
                  locale,
                )}
                onChangeText={(text) => {
                  const value = parseCurrencyInput(text);
                  setInspectionData((prev: any) => ({
                    ...prev,
                    ...(prev.periciaCompleta
                      ? { valorPericia: value }
                      : { precoSugerido: value }),
                  }));
                }}
                style={{ minHeight: 44, fontSize: 14 }}
              />
            ) : (
              <Text style={[styles.description, { fontStyle: "italic" }]}>
                {inspectionData.periciaCompleta
                  ? t("technicianNewServiceScreen.hiddenValue")
                  : t("technicianNewServiceScreen.noSuggestedPrice")}
              </Text>
            )}
          </View>

          <View style={styles.submitActions}>
            <TouchableOpacity
              style={[
                styles.saveInspectionButton,
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleStartCar}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {loadingStartCar ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.saveInspectionButtonText}>
                    {
                      inspectionData.periciaCompleta
                      ? t("technicianNewServiceScreen.saveAndStartCar")
                      : t("technicianNewServiceScreen.startCarButton") 
                    }
                </Text>
              )}
            </TouchableOpacity>
          
            <TouchableOpacity
              style={[
                styles.saveInspectionButton,
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleCreateInspection}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {loadingCreateInspection ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.saveInspectionButtonText}>
                    {
                      inspectionData.periciaCompleta
                      ? t("technicianNewInspectionScreen.actions.save")
                      : t("common.save") 
                    }
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
            inspectionComplete={inspectionData.periciaCompleta}
            onClose={handleCloseInspectionModal}
            onSave={handleSavePartInspection}
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
  input: {
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    borderRadius: 12,
    minHeight: 44,
    fontSize: 14,
    backgroundColor: colors.card_item,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  surfaceSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    backgroundColor: colors.card_item,
  },

  label: {
    color: "white",
    fontWeight: "500",
    //  color: colors.textMuted,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  inputStyle: {
    color: "white",
    backgroundColor: colors.backgroundBase,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
  },

  section: {},

  // Carro
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
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  submitActions: {
    gap: 12,
  },

  saveProgressButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSurface,
    alignItems: "center",
    justifyContent: "center",
  },

  saveProgressButtonText: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15,
  },

  saveInspectionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  saveInspectionButtonText: {
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

  gridItem: {
    width: "31%",
    alignItems: "center",
  },

  photoLabel: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },

  photoSection: {
    gap: 8,
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
  
  photo: {
    width: "100%",
    height: "100%",
  },

  photosHint: {
    marginBottom: 8,
    fontSize: 12,
    color: colors.textMuted,
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

  photoCounter: {
    marginTop: 6,
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
  },

  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
  },

  currencyWrapper: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 16,
    color: colors.white,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  currencySelectContainer: {
    width: 90,
    position: "relative",
  },

  currencySelectButton: {
    height: 56,

    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    backgroundColor: colors.backgroundBase,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },

  currencySelectText: {
    fontWeight: "600",
    color: colors.text,
    fontSize: 14,
  },

  currencyDropdown: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 999,
    elevation: 10,
    padding: 6,
  },

  currencyItem: {
    padding: 10,
    borderRadius: 10,
  },

  currencyText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },

  dropdownItemActive: {
    backgroundColor: colors.surface,
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

  photoContainer: {
    width: "31%",
    alignItems: "center",
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

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 0,
    padding: 0,
  },
});
