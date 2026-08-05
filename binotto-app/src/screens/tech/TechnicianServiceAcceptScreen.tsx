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
  Linking,
  Pressable,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import * as ImagePicker from "expo-image-picker";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import InfiniteImageCarousel from "@/components/common/InfiniteImageCarousel";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/common/AppHeader";
import TechnicianManagementService from "@/services/TechnicianManagementService";
import { Input } from "@/components/common/Input";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/utils/currency";
import { CustomSwitch } from "@/components/common/CustomSwitch";
import CarDiagram from "@/components/common/CarDiagram";
import LegendDot from "@/components/common/LegendDot";
import { REPAIR_COLORS } from "@/theme/repairColors";
import { CAR_PARTS, createInitialPartsState, normalizeReparos } from "@/utils/carParts";
import { PartInspection, Photo, RepairType } from "@/types/carParts";
import InspectionModal from "@/components/common/InspectionModal";
import TechnicianInspectionService from "@/services/TechnicianInspectionService";
import { Calendar, Camera, Clock, Euro, MapPin, MessageSquare, MousePointer2 } from "lucide-react-native";
import { GLOBAL } from "@/constants/global";
import { formatDate, formatHour } from "@/utils/date";
import EmptyState from "@/components/common/EmptyState";
import ConfirmCancelAcceptModal from "@/components/common/ConfirmCancelAcceptModal";
import { colorStatus } from "@/services/ColorStatusService";
import { getStatusLabelKey } from "@/utils/status";
import PermissionController from "@/controllers/permission.controller";
import { optimizeImage } from "@/utils/images";
import { normalizePhotos } from "@/utils/photos";

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

export default function TechnicianServiceAcceptScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const serviceId = route.params?.serviceId;
  const backTo = route.params?.backTo;

  const [service, setService] = useState<any>(null);
  const [inspectionId, setInspectionId] = useState<number | null>(null);
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
  
  const [photosRemove, setPhotosRemove] = useState<string[]>([]);
  const [photosCompleteInspectionRemove, setPhotoCompleteInspectionRemove] = useState<string[]>([]);
  const [photosRepairRemove, setPhotosRepairRemove] = useState<{ partId: string; path: string }[]>([]);

  // Cancelar aceite modal
  const [modalCancelVisible, setModalCancelVisible] = useState(false);
  const [serviceToCancelId, setServiceToCancelId] = useState<number | null>(
    null,
  );
  const [loadingCancel, setLoadingCancel] = useState<boolean>(false);

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

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStartCar, setLoadingStartCar] = useState<boolean>(false);
  const [loadingUpdateInspection, setLoadingUpdateInspection] = useState<boolean>(false);
  const [error, setError] = useState<string | null>("");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [inspectionModalVisible, setInspectionModalVisible] = useState<boolean>(false);

  // constantes
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

  // resumo das alterações
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
      const photo = photosPericiaCompleta[type];
      if (photo?.type === "existing") {
        setPhotoCompleteInspectionRemove((prev) => [
          ...prev,
          photo.uri.replace(`${storage}/`, ""),
        ]);
      }

      setPhotosPericiaCompleta((prev) => ({
        ...prev,
        [type]: null,
      }));
    } else {
      const photo = photos[type];
      if (photo?.type === "existing") {
        setPhotosRemove((prev) => [...prev, photo.uri.replace(`${storage}/`, "")]);
      }

      setPhotos((prev) => ({
        ...prev,
        [type]: null,
      }));
    }
  };

  const removeReparoPhoto = (partId: string, photo: Photo) => {
    if (!photo || photo.type !== "existing") return;

    const path = photo.uri.replace(`${storage}/`, "");

    setPhotosRepairRemove((prev) => [...prev, { partId, path }]);
  };

  const handleOpenCancelModal = (serviceId: number) => {
    setServiceToCancelId(serviceId);
    setModalCancelVisible(true);
  };

  const handleCancelRequest = async (motivo?: string) => {
    if (serviceToCancelId) {
      await handleCancelAcceptService(serviceToCancelId, motivo);
    }
  };

  const handleCloseModalCancel = () => {
    setModalCancelVisible(false);
    setServiceToCancelId(null);
  };

  const resetForm = () => {
    setInspectionId(null)

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
    setPhotosRemove([]);
    setPhotoCompleteInspectionRemove([]);
    setPhotosRepairRemove([]);
    setError(null);
  };

  const handleOpenInspectionModal = (id: string) => {
    setEditingPartId(id);
    setInspectionModalVisible(true);
  };

  const handleCloseInspectionModal = () => {
    setInspectionModalVisible(false);
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

  const buildFormData = () => {
    const periciaCompleta = inspectionData.periciaCompleta;

    const formData = new FormData();

    formData.append("oficina_id", String(service?.oficina_id));
    formData.append("servico_id", String(service?.id));
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

    formData.append("fotos_remover", JSON.stringify(photosRemove));
    formData.append("fotos_reparos_remover", JSON.stringify(photosRepairRemove));
    formData.append("fotos_pericia_completa_remover", JSON.stringify(photosCompleteInspectionRemove));

    return formData;
  };

  const openInMaps = (address: string) => {
    if (!address) return;

    const query = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  // requests
  const loadService = async () => {
    try {
      setLoading(true);

      const res = await TechnicianManagementService.getServiceById(serviceId);
      const service = res.data;
      setService(service);

      const periciaAbertaVinculada = service.pericia_aberta_vinculada;

      if(periciaAbertaVinculada){
        const hasPrice =
          Number(periciaAbertaVinculada.preco_sugerido) > 0 ||
          Number(periciaAbertaVinculada.valor_pericia) > 0;

        setInspectionData((prev: any) => ({
          ...prev,
          placa: periciaAbertaVinculada.placa ?? prev.placa,
          chassi: periciaAbertaVinculada.chassi ?? prev.chassi,
          marcaModelo: periciaAbertaVinculada.marca_modelo ?? prev.marcaModelo,
          periciaCompleta: periciaAbertaVinculada.tipo === 'completa',
          inserirValor: hasPrice,
          precoSugerido: String(Number(periciaAbertaVinculada.preco_sugerido) * 100 || "0"),
          valorPericia: String(Number(periciaAbertaVinculada.valor_pericia) * 100 || "0"),
        }));
      
        setPartsState(normalizeReparos(periciaAbertaVinculada.reparos_necessarios ?? []));
        setPhotos(normalizePhotos(periciaAbertaVinculada.fotos ?? {}));
        setPhotosPericiaCompleta(normalizePhotos(periciaAbertaVinculada.fotos_pericia_completa ?? {}));
        setInspectionId(Number(periciaAbertaVinculada.id))
      }
    } catch (err) {
      setError(t("technicianServiceExecutionScreen.loadingServiceError"));
    } finally {
      setLoading(false);
    }
  };

  const handleStartCar = async () => {
    try {
      setError(null);

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

  const handleUpdateInspection = async () => {
    try {
      setError(null);

      if (inspectionId == null) {
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

      setLoadingUpdateInspection(true);

      const payload = buildFormData();

      await TechnicianInspectionService.updateInspection(inspectionId, payload);

      navigation.navigate("Inspections");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianNewServiceScreen.submitError");

      setError(message);
    } finally {
      setLoadingUpdateInspection(false);
    }
  };

  const handleCancelAcceptService = async (serviceId: number, motivo?: string) => {
    try {
      setLoadingCancel(true);

      await TechnicianManagementService.cancelAcceptService(serviceId, motivo);
      setModalCancelVisible(false);
      setServiceToCancelId(null);

      navigation.navigate("Dashboard");
    } catch (error) {
    } finally {
      setLoadingCancel(false);
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
      <View style={[styles.container, {}]}>
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

        {error && (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content}>

          <View style={styles.card}>
            {/* Header */}
            <View style={styles.topRow}>
              { service.tecnico_label && (
                <Text style={{ color: colors.text, fontSize: 16}}>
                  {service.tecnico_label}
                </Text>
              )}

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

            {/* INFO */}
            <View style={styles.infoBlock}>
              {service?.oficina?.endereco_display?.titulo ? (
                <View style={styles.infoItem}>
                  <MapPin size={16} color={colors.primary} style={{ marginTop: 2}} />

                  <Pressable
                    onPress={() =>
                      openInMaps(service.oficina.endereco_display.subtitulo)
                    }
                    style={styles.addressRow}
                  >
                    <Text style={styles.addressText}>
                      {service.oficina.endereco_display.subtitulo}
                    </Text>

                    <View
                      style={{
                        marginTop: 2,
                        transform: [{ rotate: "90deg" }],
                      }}
                    >
                      <MousePointer2 size={14} color={colors.primary} />
                    </View>
                  </Pressable>
                </View>
              ) : null}

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
                <Euro size={14} color={colors.primary} style={{ marginTop: 2}}/>
                <Text style={styles.price}>
                  {formatCurrency(
                    service.valor_total ?? 0,
                    service.moeda,
                    locale,
                  )}
                </Text>
              </View>
            </View>
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
                onValueChange={() => {}}
                activeColor={colors.primary}
                inactiveColor={colors.border}
                disabled={true}
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
                  style={{ minHeight: 44, fontSize: 14 }}
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
            />
          </View>

          {/* FOTOS DA PERÍCIA COMPLETA */}
          {inspectionData.periciaCompleta && (
            <View style={styles.section}>
              <View style={{ ...styles.rowBetween}}>
                <Text style={[styles.label, { marginBottom: 16 }]}>
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
                    handleOpenInspectionModal(id);
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

                  <Text style={styles.summaryText}>
                    {item.nome}
                  </Text>

                  <Text style={styles.separator}>—</Text>

                  <Text style={styles.procedureText}>
                    {item.procedimento}
                  </Text>

                  {item.hasComment && (
                    <MessageSquare
                      size={12}
                      color={colors.textMuted}
                    />
                  )}

                  {item.hasPhotos && (
                    <Camera
                      size={12}
                      color={colors.textMuted}
                    />
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

          {/* AÇÕES */}
          <View style={{gap: 12}}>
            <TouchableOpacity
              style={[
                styles.buttonSubmit,
                loadingStartCar && styles.buttonSubmitDisabled,
              ]}
              onPress={handleStartCar}
              activeOpacity={0.8}
              disabled={loadingStartCar}
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
          
            <TouchableOpacity
              style={[
                styles.buttonSubmit,
                loadingUpdateInspection && styles.buttonSubmitDisabled,
              ]}
              onPress={handleUpdateInspection}
              activeOpacity={0.8}
              disabled={loadingUpdateInspection}
            >
              {loadingUpdateInspection ? (
                <ActivityIndicator size="small" color={colors.black} />
              ) : (
                <Text style={styles.buttonSubmitText}>
                    {
                      inspectionData.periciaCompleta
                      ? t("technicianNewInspectionScreen.actions.save")
                      : t("common.save") 
                    }
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleOpenCancelModal(service.id)}
              disabled={loadingCancel}
            >
              <Text style={styles.cancelButtonText}>
                {t("technicianServiceDetailsScreen.cancelAccept")}
              </Text>
              <Text style={styles.cancelButtonTextSmall}>
                {t("technicianServiceDetailsScreen.cancelAcceptSmallDesc")}
              </Text>
            </TouchableOpacity>
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

        {inspectionModalVisible && editingPartId && (
          <InspectionModal
            visible={inspectionModalVisible}
            partName={t(
              CAR_PARTS.find((part) => part.id === editingPartId)
                ?.labelKey ?? "",
            )}
            value={partsState[editingPartId]}
            inspectionComplete={inspectionData.periciaCompleta}
            onClose={handleCloseInspectionModal}
            onSave={handleSavePartInspection}
            removeReparoPhoto={(photo) =>
              editingPartId && removeReparoPhoto(editingPartId, photo)
            }
          />
        )}

        {/* MODAL DE CANCELAMENTE DE ACEITE DE SERVIÇO */}
        <ConfirmCancelAcceptModal
          title={t("technicianServiceDetailsScreen.cancelTitle")}
          subtitle={t("technicianServiceDetailsScreen.cancelSubtitle")}
          confirmText={t(
            "technicianServiceDetailsScreen.cancelConfirmButton",
          )}
          cancelText={t("technicianServiceDetailsScreen.cancelButton")}
          visible={modalCancelVisible}
          loading={loadingCancel}
          onConfirm={handleCancelRequest}
          onCancel={handleCloseModalCancel}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
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
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    padding: 12,
    gap: 14,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
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
    alignItems: "flex-start",
    gap: 8,
  },

  infoText: {
    color: colors.text,
    fontSize: 13,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 2,
    fontSize: 14,
  },

  addressText: {
    color: colors.primary,
    fontSize: 14,
  },

  price: {
    color: "white",
    fontSize: 14,
  },

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

  cancelButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#2E2E2E",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
  },

  cancelButtonTextSmall: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
