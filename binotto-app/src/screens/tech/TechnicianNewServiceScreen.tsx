import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import * as ImagePicker from "expo-image-picker";
import InfiniteImageCarousel from "@/components/common/InfiniteImageCarousel";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/common/AppHeader";
import WorkshopService from "@/services/WorkshopService";
import TechnicianManagementService from "@/services/TechnicianManagementService";
import { Input } from "@/components/common/Input";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/currency";
import { Select } from "@/components/common/Select";
import { CustomSwitch } from "@/components/common/CustomSwitch";
import CarDiagram from "@/components/common/CarDiagram";
import LegendDot from "@/components/common/LegendDot";
import { REPAIR_COLORS } from "@/theme/repairColors";
import {
  CAR_PARTS,
  createInitialPartsState,
  normalizeReparos,
} from "@/utils/carParts";
import { PartInspection, Photo, RepairType } from "@/types/carParts";
import InspectionModal from "@/components/common/InspectionModal";
import TechnicianInspectionService from "@/services/TechnicianInspectionService";
import { AlertCircle, Camera, MessageSquare } from "lucide-react-native";
import { GLOBAL } from "@/constants/global";
import ModalList from "@/components/common/ModalList";
import { formatDate, formatHour } from "@/utils/date";
import PermissionController from "@/controllers/permission.controller";
import { optimizeImage } from "@/utils/images";

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
const PHOTO_TYPES_TECHNICIAN = [
  "diagonalFrontDriver", 
  "diagonalRearPassenger",
  "plateOrChassis",
  "workOrder",
] as const;

type TechnicianPhotoType = (typeof PHOTO_TYPES_TECHNICIAN)[number];
type InspectionPhotoType = (typeof PHOTO_TYPES_INSPECTION)[number];
type TechnicianPhotoLabels = Record<TechnicianPhotoType, string>;
type InspectionPhotoLabels = Record<InspectionPhotoType, string>;
type PhotoType = TechnicianPhotoType | InspectionPhotoType;

const storage = GLOBAL.storage;

export default function TechnicianNewServiceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { locale } = useLanguage();
  const { t } = useTranslation();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [workshops, setWorkshops] = useState<any>(null);
  const [inspections, setInspections] = useState<any>([]);
  const [simultaneousServices, setSimultaneousServices] = useState<any>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<
    number | null
  >(null);
  const [inspectionData, setInspectionData] = useState<any>({
    placa: "",
    chassi: "",
    marcaModelo: "",
    periciaCompleta: false,
    inserirValor: false,
    precoSugerido: "0",
    valorPericia: "0",
  });
  const [partsState, setPartsState] = useState(() => createInitialPartsState());
  const [technicianPhotos, setTechnicianPhotos] = useState<
    Record<string, Photo | null>
  >({
    diagonalFrontDriver: null,
    diagonalRearPassenger: null,
    plateOrChassis: null,
    workOrder: null,
  });

  const [inspectionPhotos, setInspectionPhotos] = useState<
    Record<string, Photo | null>
  >({
    document: null,
    km: null,
    chassis: null,
  });

  const PHOTO_TECHNICIAN_LABELS: TechnicianPhotoLabels = {
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

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [modalPartVisible, setModalPartVisible] = useState(false);

  const [workshopLoading, setWorkshopLoading] = useState<boolean>(false);
  const [loadingStartCar, setLoadingStartCar] = useState<boolean>(false);
  const [loadingSaveInspection, setLoadingSaveInspection] = useState<boolean>(false);
  const [error, setError] = useState<string | null>("");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [serviceDecision, setServiceDecision] = useState<
    "existing" | "new" | null
  >(null);
  const [inspectionDecision, setInspectionDecision] = useState<
    "existing" | "new" | null
  >(null);
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const isSubmitting = loadingStartCar || loadingSaveInspection;

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

  const handleOpenImage = (photo: Photo) => {
    if (!photo) return;

    if (photo.type === "new") {
      setSelectedImage(photo.asset.uri);
    } else {
      setSelectedImage(photo.uri);
    }

    setViewerVisible(true);
  };

  // const handlePickImage = async (type: PhotoType, inspectionPhoto: boolean = false) => {
  //   PermissionController.checkGalleryPermission(navigation,async ()=>{
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ["images"],
  //       quality: 0.8,
  //     });

  //     if (result.canceled) return;

  //     const photo: Photo = {
  //       type: "new",
  //       asset: result.assets[0],
  //     };

  //     if (inspectionPhoto) {
  //       setInspectionPhotos((prev) => ({
  //         ...prev,
  //         [type]: photo,
  //       }));
  //     } else {
  //       setTechnicianPhotos((prev) => ({
  //         ...prev,
  //         [type]: photo,
  //       }));
  //     }
  //   });
  // };

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
        setInspectionPhotos((prev) => ({
          ...prev,
          [type]: photo,
        }));
      } else {
        setTechnicianPhotos((prev) => ({
          ...prev,
          [type]: photo,
        }));
      }
    });
  };

  const removePhoto = (type: PhotoType, inspectionPhoto: boolean = false) => {
    if (inspectionPhoto) {
      setInspectionPhotos((prev) => ({
        ...prev,
        [type]: null,
      }));
    } else {
      setTechnicianPhotos((prev) => ({
        ...prev,
        [type]: null,
      }));
    }
  };

  const resetForm = () => {
    setServiceDecision(null);
    setInspectionDecision(null);
    setSelectedWorkshop(null);
    setSimultaneousServices(null);
    setInspections([]);
    setSelectedInspectionId(null);
    setCanEdit(true);

    setInspectionData({
      placa: "",
      chassi: "",
      marcaModelo: "",
      periciaCompleta: false,
      inserirValor: false,
      precoSugerido: "0",
      valorPericia: "0",
    });

    setTechnicianPhotos({
      diagonalFrontDriver: null,
      diagonalRearPassenger: null,
      plateOrChassis: null,
      workOrder: null,
    });

    setInspectionPhotos({
      document: null,
      km: null,
      chassis: null,
    });

    setPartsState(() => createInitialPartsState());
    setWorkshopLoading(false);
    setError(null);
  };

  const normalizePhotos = (photos: any = {}) => {
    return Object.entries(photos).reduce((acc: any, [key, path]) => {
      if (!path) {
        acc[key] = null;
        return acc;
      }

      acc[key] = {
        type: "existing",
        uri: `${storage}/${path}`,
      };

      return acc;
    }, {});
  };

  const handleUseInspection = (inspection: any) => {
    setSelectedInspectionId(Number(inspection.id));

    const hasPrice =
      Number(inspection.preco_sugerido) > 0 ||
      Number(inspection.valor_pericia) > 0;

    setInspectionData((prev: any) => ({
      ...prev,
      placa: inspection.placa ?? prev.placa,
      chassi: inspection.chassi ?? prev.chassi,
      marcaModelo: inspection.marca_modelo ?? prev.marcaModelo,
      periciaCompleta: inspection.tipo === "completa",
      inserirValor: hasPrice,
      precoSugerido: String(Number(inspection.preco_sugerido) * 100 || "0"),
      valorPericia: String(Number(inspection.valor_pericia) * 100 || "0"),
    }));

    setPartsState(normalizeReparos(inspection.reparos_necessarios ?? []));
    setTechnicianPhotos(normalizePhotos(inspection.fotos ?? {}));
    setInspectionPhotos(normalizePhotos(inspection.fotos_pericia_completa ?? {}));
    setInspectionDecision("existing");
    setCanEdit(false);
  };

  const handleRemoveInspection = () => {
    setInspectionDecision(null);
    setSelectedInspectionId(null);
    setInspections([]);
    setCanEdit(true);

    setInspectionData({
      placa: "",
      chassi: "",
      marcaModelo: "",
      periciaCompleta: false,
      inserirValor: false,
      precoSugerido: "0",
      valorPericia: "0",
    });

    setPartsState(createInitialPartsState());

    setInspectionPhotos({
      document: null,
      km: null,
      chassis: null,
    });
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

  const handlePlateChange = (text: string) => {
    setInspectionData((prev: any) => ({
      ...prev,
      placa: text,
    }));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      loadInspectionsByPlate(text);
    }, 500);
  };

  const buildFormData = () => {
    const periciaCompleta = inspectionData.periciaCompleta;

    const formData = new FormData();

    formData.append("oficina_id", String(selectedWorkshop?.id));
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

    Object.entries(technicianPhotos).forEach(([type, photo]) => {
      if (!photo || photo.type !== "new") return;
      formData.append(`fotos[${type}]`, {
        uri: photo.asset.uri,
        type: photo.asset.mimeType ?? "image/jpeg",
        name: photo.asset.fileName ?? `${type}.jpg`,
      } as any);
    });

    if (periciaCompleta) {
      Object.entries(inspectionPhotos).forEach(([type, photo]) => {
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

  // requests
  const handleStartCar = async () => {
    try {
      setError(null);

      if (!selectedWorkshop) {
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

      if (!canEdit && selectedInspectionId) {
        const response =
          await TechnicianManagementService.startServiceFromInspection(
            selectedInspectionId,
            {
              oficina_id: selectedWorkshop?.id,
            },
          );

        navigation.navigate("Dashboard");
        return;
      }

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

      if (!selectedWorkshop) {
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

      setLoadingSaveInspection(true);

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
        t("technicianNewServiceScreen.submitError");

      setError(message);
    } finally {
      setLoadingSaveInspection(false);
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

  const loadInspectionsByPlate = async (plateOrChassis: string) => {
    const plateNormalize = plateOrChassis.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    if (plateNormalize.length < 4) {
      setInspections([]);
      setInspectionDecision(null);
      return;
    }

    try {
      setError(null);

      const res =
        await TechnicianInspectionService.getInspectionsByPlate(plateNormalize);
      setInspections(res.data);

      if (res.data.length > 0) {
        setInspectionDecision(null);
      }
    } catch (error: any) {}
  };

  const loadSimultaneousServices = async (oficinaId: number) => {
    try {
      const res =
        await TechnicianManagementService.getSimultaneousServices(oficinaId);
      setSimultaneousServices(res.data);
    } catch (error: any) {}
  };

  useFocusEffect(
    useCallback(() => {
      resetForm();
      loadWorkshops();
    }, [route.params]),
  );

  useEffect(() => {
    setServiceDecision(null);
  }, [selectedWorkshop?.id]);

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
      <View style={[styles.container, {}]}>
        <AppHeader
          logo={require("@/assets/binotto-dog-logo-cropped.png")}
          title={t("technicianNewServiceScreen.title")}
          onBack={() => navigation.goBack()}
        />

        {error && (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Select
              label={t("technicianNewServiceScreen.workshopLabel")}
              placeholder={t(
                "technicianNewServiceScreen.workshopSelectPlaceholder",
              )}
              colorText={colors.white}
              value={selectedWorkshop?.id ?? null}
              options={workshopOptions}
              onChange={(value) => {
                const workshop = workshops.find((w: any) => w.id === value);
                setSelectedWorkshop(workshop);

                if (workshop?.id) {
                  loadSimultaneousServices(workshop.id);
                } else {
                  setSimultaneousServices(null);
                }
              }}
              style={{ backgroundColor: "#141414" }}
            />
          </View>

          {simultaneousServices?.length > 0 && serviceDecision === null && (
            <View style={styles.simultaneousServiceSection}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <AlertCircle
                  color="#CF9F08"
                  size={18}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={[
                    styles.inspectionsQuestionText,
                    {
                      flex: 1,
                      flexWrap: "wrap",
                    },
                  ]}
                >
                  {t("technicianNewServiceScreen.serviceExistsMessage")}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={styles.useInspectionsButton}
                  onPress={() => setServiceModalVisible(true)}
                >
                  <Text style={styles.useInspectionsButtonText}>
                    {t("technicianNewServiceScreen.useExistingService")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createNewRegisterButton}
                  onPress={() => setServiceDecision("new")}
                >
                  <Text style={styles.createNewRegisterButtonText}>
                    {t("technicianNewServiceScreen.createNewService")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
          <View style={styles.section}>
            <InfiniteImageCarousel
              images={PHOTO_TYPES_TECHNICIAN.map((type) => {
                const photo = technicianPhotos[type];
                const label = PHOTO_TECHNICIAN_LABELS[type];

                if (photo) {
                  return {
                    id: type,
                    label,
                    isPlaceholder: false,
                    uri: photo.type === "new" ? undefined : photo.uri,
                    localUri: photo.type === "new" ? photo.asset.uri : undefined,
                    onPress: () => handleOpenImage(photo),
                    onDelete: canEdit ? () => removePhoto(type) : undefined,
                    onEdit: canEdit ? () => handleTakePhoto(type) : undefined,
                  };
                } else {
                  return {
                    id: type,
                    label,
                    isPlaceholder: true,
                    placeholderSource: defaultImages[type],
                    onEdit: canEdit ? () => handleTakePhoto(type) : undefined,
                  };
                }
              })}
            />
          </View>
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
                  if (!canEdit) return;

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
                  onChangeText={handlePlateChange}
                  style={{ minHeight: 44, fontSize: 14 }}
                  editable={canEdit}
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
                  style={{ minHeight: 44, fontSize: 14 }}
                  editable={canEdit}
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
              style={{ minHeight: 44, fontSize: 14 }}
              editable={canEdit}
            />
          </View>

          {inspections.length > 0 && inspectionDecision === null && (
            <View style={styles.inspectionsSection}>
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <AlertCircle
                  color="#7443A3"
                  size={18}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={[
                    styles.inspectionsQuestionText,
                    {
                      flex: 1,
                      flexWrap: "wrap",
                    },
                  ]}
                >
                  {t("technicianNewServiceScreen.openInspectionMessage")}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={styles.useInspectionsButton}
                  onPress={() => setInspectionModalVisible(true)}
                >
                  <Text style={styles.useInspectionsButtonText}>
                    {t("technicianNewServiceScreen.useExistingInspection")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createNewRegisterButton}
                  onPress={() => setInspectionDecision("new")}
                >
                  <Text style={styles.createNewRegisterButtonText}>
                    {t("technicianNewServiceScreen.createNewRecord")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!canEdit && (
            <View
              style={[
                styles.inspectionsSection,
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 0,
                },
              ]}
            >
              <Text style={{ color: "#7443A3", fontWeight: "700" }}>
                {t("technicianNewServiceScreen.linkedInspectionLabel")}
              </Text>
              <TouchableOpacity onPress={handleRemoveInspection}>
                <Text
                  style={{
                    color: colors.textMuted,
                    textDecorationLine: "underline",
                  }}
                >
                  {t("technicianNewServiceScreen.removeInspection")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {inspectionData.periciaCompleta && (
            <View style={styles.section}>
              <View style={{ ...styles.rowBetween, marginBottom: 8 }}>
                <Text style={styles.label}>
                  {t("technicianNewServiceScreen.inspectionPhotosLabel")}
                </Text>
              </View>

              <InfiniteImageCarousel
                images={PHOTO_TYPES_INSPECTION.map((type) => {
                  const photo = inspectionPhotos[type];
                  const label = PHOTO_INSPECTION_LABELS[type];

                  if (photo) {
                    return {
                      id: type,
                      label,
                      isPlaceholder: false,
                      uri: photo.type === "new" ? undefined : photo.uri,
                      localUri: photo.type === "new" ? photo.asset.uri : undefined,
                      onPress: () => handleOpenImage(photo),
                      onDelete: canEdit ? () => removePhoto(type, true) : undefined,
                      onEdit: canEdit ? () => handleTakePhoto(type, true) : undefined,
                    };
                  } else {
                    return {
                      id: type,
                      label,
                      isPlaceholder: true,
                      placeholderSource: defaultImages[type],
                      onEdit: canEdit ? () => handleTakePhoto(type, true) : undefined,
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
                  onPress={() => canEdit && toggleApplyToAllParts("PDR")}
                >
                  <Text style={styles.bulkButtonPrimaryText}>
                    {t("technicianNewServiceScreen.allPdr")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bulkButtonSecondary}
                  onPress={() => canEdit && toggleApplyToAllParts("PINTURA")}
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
                  canEdit={canEdit}
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
                  if (!canEdit) return;

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
                editable={canEdit}
              />
            ) : (
              <Text style={[styles.description, { fontStyle: "italic" }]}>
                {inspectionData.periciaCompleta
                  ? t("technicianNewServiceScreen.hiddenValue")
                  : t("technicianNewServiceScreen.noSuggestedPrice")}
              </Text>
            )}
          </View>

          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={[
                styles.buttonSubmit,
                isSubmitting && styles.buttonSubmitDisabled,
              ]}
              onPress={handleStartCar}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {loadingStartCar ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.buttonSubmitText}>
                    {
                      inspectionData.periciaCompleta
                      ? t("technicianNewServiceScreen.saveAndStartCar")
                      : t("technicianNewServiceScreen.startCarButton") 
                    }
                </Text>
              )}
            </TouchableOpacity>

            {canEdit && (
              <TouchableOpacity
                style={[
                  styles.buttonSubmit,
                  isSubmitting && styles.buttonSubmitDisabled,
                ]}
                onPress={handleCreateInspection}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {loadingSaveInspection ? (
                  <ActivityIndicator size="small" color={colors.black} />
                ) : (
                  <Text style={styles.buttonSubmitText}>
                      {
                        inspectionData.periciaCompleta
                        ? t("technicianNewServiceScreen.saveInspectionButton")
                        : t("common.save")
                      }
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
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

        {/* Modal de seleção de pericia */}
        <ModalList
          visible={inspectionModalVisible}
          title={t("technicianNewServiceScreen.selectInspectionTitle")}
          data={inspections}
          getLabel={(item) => `${item.placa} - ${formatDate(item.created_at)}`}
          onClose={() => setInspectionModalVisible(false)}
          onSelect={(inspection) => {
            setInspectionModalVisible(false);
            handleUseInspection(inspection);
          }}
          t={t}
        />

        {/* Modal de seleção de serviço */}
        <ModalList
          visible={serviceModalVisible}
          title={t("technicianNewServiceScreen.selectServiceTitle")}
          data={simultaneousServices || []}
          getLabel={(item) =>
            `${item.tecnico_label} - ${formatHour(item.horario_previsto_chegada)}`
          }
          onClose={() => setServiceModalVisible(false)}
          onSelect={(service) => {
            setServiceModalVisible(false);
            navigation.navigate("ServiceDetail", {
              serviceId: service.id,
            });
          }}
          t={t}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background2,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  section: {},
  surfaceSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#141414",
  },
  label: {
    fontWeight: "500",
    color: colors.white,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 0,
    padding: 0,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoContainer: {
    width: "31%",
    alignItems: "center",
  },
  photoLabel: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
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
  buttonSubmit: {
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
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

  // Inspections
  inspectionsSection: {
    padding: 16,
    gap: 16,
    backgroundColor: "#1A1222",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#522C77",
  },

  inspectionsQuestionText: {
    color: colors.white,
  },

  useInspectionsButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.primary,
  },

  useInspectionsButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.black,
  },

  createNewRegisterButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#141414",
  },

  createNewRegisterButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },

  simultaneousServiceSection: {
    padding: 16,
    gap: 16,
    backgroundColor: "#211B0A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#715709",
  },
});
