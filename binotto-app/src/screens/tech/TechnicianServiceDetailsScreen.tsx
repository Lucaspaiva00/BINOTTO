import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { colors } from "@/theme/colors";

import { GLOBAL } from "@/constants/global";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import ImageViewerModal from "@/components/common/ImageViewerModal";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/common/AppHeader";
import TechnicianManagementService from "@/services/TechnicianManagementService";
import EmptyState from "@/components/common/EmptyState";
import {
  formatArrivalTime,
  formatDate,
  formatDateKey,
  formatHour,
} from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import { isServiceAvailableForTechnician } from "@/utils/serviceAvailability";
import { useAuth } from "@/contexts/AuthContext";
import { getStatusLabelKey } from "@/utils/status";
import AcceptServiceModal from "@/components/common/AcceptServiceModal";
import ConfirmRefuseModal from "@/components/common/ConfirmRefuseModal";
import { Calendar, Car, Clock, Euro, MapPin } from "lucide-react-native";
import { colorStatus } from "@/services/ColorStatusService";
import { SafeAreaView } from "react-native-safe-area-context";

const storage = GLOBAL.storage;

export default function TechnicianServiceDetailsScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const { authData } = useAuth();
  const { t } = useTranslation();
  const route = useRoute<any>();
  const serviceId = route.params?.serviceId;
  const backTo = route.params?.backTo;

  // states
  const [service, setService] = useState<any>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptingServiceId, setAcceptingServiceId] = useState<number | null>(
    null,
  );
  const [selectedDateService, setSelectedDateService] = useState<{
    data_inicio: string | null;
    data_fim: string | null;
  }>({
    data_inicio: null,
    data_fim: null,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [accepting, setAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // utils
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingCancelCandidature, setLoadingCancelCandidature] = useState<boolean>(false);

  // refuseModal
  const [refuseModalVisible, setRefuseModalVisible] = useState(false);
  const [serviceToRefuseId, setServiceToRefuseId] = useState<number | null>(
    null,
  );
  const [loadingRefuse, setLoadingRefuse] = useState<boolean>(false);

  // constants
  const isAvailable = isServiceAvailableForTechnician(service, authData?.profileId,);

  // functions
  const handleOpenImage = (uri: string) => {
    setSelectedImage(`${storage}/${uri}`);
    setViewerVisible(true);
  };

  // modal
  const handleOpenAcceptModal = (
    serviceId: number,
    dataInicio: string,
    dataFim: string,
  ) => {
    setSelectedDateService({
      data_inicio: dataInicio,
      data_fim: dataFim,
    });

    setAcceptingServiceId(serviceId);
    setSelectedDate(new Date(dataInicio));
    setArrivalTime(new Date());
    setAcceptError(null);
    setAcceptSuccess(false);
    setShowAcceptModal(true);
  };

  const handleCloseAcceptModal = () => {
    setShowAcceptModal(false);
    setAcceptError(null);
    setAcceptSuccess(false);
    setAcceptingServiceId(null);
  };

  const handleOpenRefuseModal = (serviceId: number) => {
    setServiceToRefuseId(serviceId);
    setRefuseModalVisible(true);
  };

  const handleModalConfirm = async () => {
    if (serviceToRefuseId) {
      await handleRefuseService(serviceToRefuseId);
    }
  };

  const handleModalCancel = () => {
    setRefuseModalVisible(false);
    setServiceToRefuseId(null);
  };

  // requests
  const loadService = async () => {
    try {
      setLoading(true);

      const res = await TechnicianManagementService.getServiceById(serviceId);
      setService(res.data);
    } catch (err) {
      setError(t("technicianServiceDetailsScreen.loadingServiceError"));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptService = async (serviceId: number) => {
    try {
      setAccepting(true);
      setAcceptError(null);

      await TechnicianManagementService.acceptService(
        serviceId,
        formatDateKey(selectedDate),
        formatArrivalTime(arrivalTime),
      );

      navigation.navigate("Dashboard");
    } catch (error: any) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        t("technicianDashboardScreen.acceptError");

      setAcceptError(message);

      // Se o serviço não estiver mais disponivel, recarrega a pagina e fecha o modal
      if (status === 404) {
        await loadService();
        setTimeout(() => {
          handleCloseAcceptModal();
        }, 800);
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleRefuseService = async (serviceId: number) => {
    try {
      setLoadingRefuse(true);

      await TechnicianManagementService.refuseService(serviceId);
      setRefuseModalVisible(false);
      setServiceToRefuseId(null);

      if (backTo) {
        navigation.navigate(backTo);
      } else {
        navigation.navigate("Dashboard");
      }
    } catch (error) {
    } finally {
      setLoadingRefuse(false);
    }
  };

  const handleCancelCandidature = async (serviceId: number) => {
    try {
      setLoadingCancelCandidature(true);

      // desenvolvimento futuro
      // await TechnicianManagementService.cancelCandidature(serviceId);

      if (backTo) {
        navigation.navigate(backTo);
      } else {
        navigation.navigate("Dashboard");
      }
    } catch (error) {
    } finally {
      setLoadingCancelCandidature(false);
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

  if(service.status === "em_breve"){
    return (
      <EmptyState
        title={t("common.serviceUnavailableComingSoon")}
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

  if(service.status === "cancelado"){
    return (
      <EmptyState
        title={t("common.serviceUnavailable")}
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

  if(service.ids_tecnico_recusa?.includes(authData?.profileId) ?? false){
    return (
      <EmptyState
        title={t("common.serviceRefused")}
        buttonText={t("common.back")}
        onPress={() => {
          if (backTo) {
            navigation.navigate(backTo);
          } else {
            navigation.navigate("Calendar");
          }
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      {/* Header */}
      <AppHeader
        logo={require("@/assets/binotto-dog-logo-cropped.png")}
        title={t("technicianServiceDetailsScreen.title")}
        onBack={() => navigation.goBack()}
      />

        {error && (
          <ErrorAlert message={error} onClose={() => setError(null)} />
        )}
        
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.topRow}>
              {!!service.pericia_completa && (
                <View
                  style={[
                    styles.badge,
                    styles.inspectionRequiredBadge
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      styles.inspectionRequiredBadgeText
                    ]}
                  >
                    { t("technicianServiceDetailsScreen.inspectionRequired") }
                  </Text>
                </View>
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
                  <MapPin size={16} color={colors.primary} style={{marginTop: 2}} />

                  <View>
                    <Text style={styles.infoTextTitle}>
                      {service.oficina.endereco_display.titulo}
                    </Text>

                    <Text style={styles.infoTextSubtitle}>
                      {service.oficina.endereco_display.subtitulo}
                    </Text>
                  </View>
                </View>
              ) : null}

            <View style={styles.infoItem}>
              <Calendar size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                {service.data_inicio
                  ? `${formatDate(service.data_inicio)}${
                      service.data_fim
                        ? ` - ${formatDate(service.data_fim)}`
                        : ""
                    }`
                  : "--"}
              </Text>
            </View>

            <View style={styles.infoItem}>
              {service.quantidade_tipo === "carros" ? (
                <Car size={16} color={colors.primary} strokeWidth={2} />
              ) : (
                <Calendar size={16} color={colors.primary} strokeWidth={2} />
              )}

                <Text style={styles.infoText}>
                  {service.quantidade
                    ? `${service.quantidade} ${
                        service.quantidade_tipo === "carros"
                          ? service.quantidade === 1
                            ? t("technicianServiceDetailsScreen.car")
                            : t("technicianServiceDetailsScreen.cars")
                          : service.quantidade === 1
                            ? t("technicianServiceDetailsScreen.day")
                            : t("technicianServiceDetailsScreen.days")
                      }`
                    : "--"}
                </Text>
              </View>

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

            {/* OBS */}
            {!!service.observacoes && (
              <View style={styles.obsBox}>
                <Text style={styles.obsLabel}>
                  {t("technicianServiceDetailsScreen.observations")}
                </Text>
                <Text style={styles.obsText}>{service.observacoes}</Text>
              </View>
            )}
          </View>

          {service.status === "aguardando_aprovacao" && (
            <View style={styles.card}>
              <Text style={{color: colors.textMuted, textAlign: 'center'}}>{t('technicianServiceDetailsScreen.serviceWillBeAvailableSoon')}</Text>
            </View>
          )}
        </ScrollView>

        {/* FOOTER FIXO */}
        {(service.status === "aguardando_aprovacao" || isAvailable) && (
          // <SafeAreaView edges={["bottom"]} style={styles.footer}>
          <View style={styles.footer}>
            {service.status === "aguardando_aprovacao" ? (
              <View style={styles.containerAvailableButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={() => handleCancelCandidature(service.id)}
                  disabled={loadingCancelCandidature}
                >
                  {loadingCancelCandidature ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.cancelButtonText}>
                      {t("technicianServiceDetailsScreen.cancelCandidatureButton")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.containerAvailableButtons}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() =>
                    handleOpenAcceptModal(
                      Number(service.id),
                      service.data_inicio,
                      service.data_fim,
                    )
                  }
                >
                  <Text style={styles.acceptButtonText}>
                    {t("technicianServiceDetailsScreen.acceptService")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.refuseButton}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleOpenRefuseModal(service.id);
                  }}
                >
                  <Text style={styles.refuseButtonText}>
                    {t("technicianDashboardScreen.refuse")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          // </SafeAreaView>
        )}

        <ImageViewerModal
          visible={viewerVisible}
          image={selectedImage}
          onClose={() => {
            setViewerVisible(false);
            setSelectedImage(null);
          }}
        />

        {/* MODAL DE ACEITAR SERVIÇO */}
        <AcceptServiceModal
          visible={showAcceptModal}
          onClose={handleCloseAcceptModal}
          dataInicio={selectedDateService.data_inicio}
          dataFim={selectedDateService.data_fim}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          arrivalTime={arrivalTime}
          setArrivalTime={setArrivalTime}
          showTimePicker={showTimePicker}
          setShowTimePicker={setShowTimePicker}
          accepting={accepting}
          acceptSuccess={acceptSuccess}
          acceptError={acceptError}
          onAccept={() =>
            acceptingServiceId && handleAcceptService(acceptingServiceId)
          }
          t={t}
        />

        {/* MODAL DE CONFIRMAR RECUSA DE SERVIÇO */}
        <ConfirmRefuseModal
          title={t("technicianDashboardScreen.confirmRefuseTitle")}
          subtitle={t("technicianDashboardScreen.confirmRefuseSubtitle")}
          confirmText={t("technicianDashboardScreen.confirmRefuseButton")}
          cancelText={t("technicianDashboardScreen.cancelRefuseButton")}
          visible={refuseModalVisible}
          loading={loadingRefuse}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background2,
  },

  header: {
    padding: 16,
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
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    padding: 12,
    gap: 14,
    marginBottom: 8,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
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

  inspectionRequiredBadge: {
    backgroundColor: "#2D1A3F",
    borderWidth: 1,
    borderColor: "#4C2172",
  },

  inspectionRequiredBadgeText: {
    color: "#D8B4FE",
  },

  noInspectionBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },

  noInspectionBadgeText: {
    color: colors.textMuted,
  },

  infoBlock: {
    gap: 12,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  infoTextTitle: {
    color: colors.text,
    fontSize: 14,
  },

  infoTextSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
  },

  infoText: {
    color: colors.text,
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
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
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
    width: "31%",
    height: "31%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  photoBoxWithoutDash: {
    width: "31%",
    height: "31%",
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

  buttonDisabled: {
    opacity: 0.7,
  },

  containerAvailableButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  acceptButtonText: {
    color: colors.black,
    fontWeight: "600",
    fontSize: 16,
  },

  refuseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#bc2e2e",
  },

  refuseButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E2E2E",
  },

  cancelButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },

  footer: {
    padding: 16,
    backgroundColor: colors.background2,
  },
});
