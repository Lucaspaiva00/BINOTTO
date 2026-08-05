import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Linking,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/theme/colors";
import AppHeader from "@/components/common/AppHeader";
import { formatDate, formatDateKey, formatHour } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import TechnicianManagementService from "@/services/TechnicianManagementService";
import { formatArrivalTime } from "@/utils/date";
import { isServiceAvailableForTechnician } from "@/utils/serviceAvailability";
import { getStatusLabelKey, renderStatus } from "@/utils/status";
import AcceptServiceModal from "@/components/common/AcceptServiceModal";
import ConfirmRefuseModal from "@/components/common/ConfirmRefuseModal";
import { SearchInput } from "@/components/common/SearchInput";
import {
  DateRangeValue,
  SearchDateRangeInput,
} from "@/components/common/SearchDateRangeInput";
import Svg, { Path, Circle } from "react-native-svg";
import { Calendar, Car, Search, Wrench } from "lucide-react-native";
import { colorStatus } from "@/services/ColorStatusService";
import ListCard from "@/components/common/ListCard";
import ConfirmModal from "@/components/common/ConfirmModal";
import ServiceCardTechnician from "@/components/common/ServiceCardTechnician";

export default function TechnicianDashboardScreen() {
  const { locale } = useLanguage();
  const { authData } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const route = useRoute<any>();

  // states
  const [services, setServices] = useState<any[]>([]);
  const [completedServices, setCompletedServices] = useState<any[]>([]);

  // utils
  const [tab, setTab] = useState<"services" | "completed">("services");
  const [loadingServices, setLoadingServices] = useState<boolean>(false);
  const [loadingCompleted, setLoadingCompleted] = useState<boolean>(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptingServiceId, setAcceptingServiceId] = useState<number | null>(
    null,
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDateService, setSelectedDateService] = useState<{
    data_inicio: string | null;
    data_fim: string | null;
  }>({
    data_inicio: null,
    data_fim: null,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [accepting, setAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>("");

  // Finalizar serviço
  const [loadingFinish, setLoadingFinish] = useState<boolean>(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [serviceToFinishId, setServiceToFinishId] = useState<number | null>(null);

  // refuseModal
  const [refuseModalVisible, setRefuseModalVisible] = useState(false);
  const [serviceToRefuseId, setServiceToRefuseId] = useState<number | null>(
    null,
  );
  const [loadingRefuse, setLoadingRefuse] = useState<boolean>(false);

  // paginação
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesLastPage, setServicesLastPage] = useState(1);
  const [loadingMoreServices, setLoadingMoreServices] = useState(false);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedLastPage, setCompletedLastPage] = useState(1);
  const [loadingMoreCompleted, setLoadingMoreCompleted] = useState(false);

  // filters
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const serviceFilters = [
    {
      label: t("technicianDashboardScreen.filterServices.allServices"),
      value: null,
    },
    {
      label: t("technicianDashboardScreen.filterServices.acceptedServices"),
      value: "aceito",
    },
    {
      label: t("technicianDashboardScreen.filterServices.availableServices"),
      value: "aguardando",
    },

    // {
    //   label: t("technicianDashboardScreen.filterServices.inProgressServices"),
    //   value: "em_execucao",
    // },
    {
      label: t("technicianDashboardScreen.filterServices.pendingServices"),
      value: "aguardando_aprovacao",
    },
  ];

  // filter completed
  const [completedFilter, setCompletedFilter] = useState<
    "7" | "15" | "30" | "custom"
  >("7");
  const [customWorkshopPlate, setCustomWorkshopPlate] = useState("");
  const [customDateRange, setCustomDateRange] = useState<DateRangeValue>({
    start: null,
    end: null,
  });

  const completedFilters = [
    {
      label: t("technicianDashboardScreen.filterCompleted.7Days"),
      value: "7",
    },
    {
      label: t("technicianDashboardScreen.filterCompleted.15Days"),
      value: "15",
    },
    {
      label: t("technicianDashboardScreen.filterCompleted.30Days"),
      value: "30",
    },
    {
      label: t("technicianDashboardScreen.filterCompleted.custom"),
      value: "custom",
    },
  ];

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

  const handleOpenRejectModal = (serviceId: number) => {
    setServiceToRefuseId(serviceId);
    setRefuseModalVisible(true);
  };

  const handleModalConfirm = async () => {
    if (serviceToRefuseId) {
      await handleRejectService(serviceToRefuseId);
    }
  };

  const handleModalCancel = () => {
    setRefuseModalVisible(false);
    setServiceToRefuseId(null);
  };

  const handleOpenFinishModal = (serviceId: number) => {
    setServiceToFinishId(serviceId);
    setFinishModalVisible(true);
  };

  const handleConfirmFinish = async () => {
    if (!serviceToFinishId) return;

    await handleFinishService(serviceToFinishId);

    setFinishModalVisible(false);
    setServiceToFinishId(null);
    handleChangeTab("completed");
  };

  const handleCancelFinish = () => {
    setFinishModalVisible(false);
    setServiceToFinishId(null);
  };

  // navegações
  const handleOpenCreateService = async () => {
    navigation.navigate("NewService");
  };

  const handleChangeTab = async (value: "services" | "completed") => {
    setTab(value);

    if (value === "services") {
      await loadServices(1, false, statusFilter);
    }

    if (value === "completed") {
      await loadCompleted(1, false);
    }
  };

  const handleCustomDateConfirm = async () => {
    if (!customDateRange.start && !customDateRange.end) {
      return;
    }

    await loadCompleted(1, false, "custom");
  };

  // requests
  const handleFinishService = async (serviceId: number) => {
    try {
      setLoadingFinish(true);

      await TechnicianManagementService.finishExecution(serviceId);
      await loadServices(1, false, statusFilter);
    } catch (error: any) {
      console.log(error)
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianServiceExecutionScreen.submitError");

      setError(message);
    } finally {
      setLoadingFinish(false);
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

      await loadServices(1, false, statusFilter);

      setAcceptSuccess(true);
    } catch (error: any) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        t("technicianDashboardScreen.acceptError");

      setAcceptError(message);

      // Se o serviço não estiver mais disponivel, recarrega a lista e fecha o modal
      if (status === 404) {
        await loadServices(1, false, statusFilter);
        setTimeout(() => {
          handleCloseAcceptModal();
        }, 800);
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectService = async (serviceId: number) => {
    try {
      setLoadingRefuse(true);

      await TechnicianManagementService.refuseService(serviceId);

      await loadServices(1, false, statusFilter);

      setRefuseModalVisible(false);
      setServiceToRefuseId(null);
    } catch (error) {
    } finally {
      setLoadingRefuse(false);
    }
  };

  const loadServices = async (
    page = 1,
    append = false,
    status: string[] = [],
  ) => {
    try {
      if (page === 1) {
        setLoadingServices(true);
      } else {
        setLoadingMoreServices(true);
      }

      const res = await TechnicianManagementService.getTechnicianServices(
        page,
        null,
        status,
        true,
      );
      const newData = res.data.data;

      setServicesLastPage(res.data.last_page);
      setServicesPage(page);

      if (append) {
        setServices((prev) => [...prev, ...newData]);
      } else {
        setServices(newData);
      }
    } catch (err) {
      console.log("Erro pendentes", err);
    } finally {
      setLoadingServices(false);
      setLoadingMoreServices(false);
    }
  };

  const loadCompleted = async (
    page = 1,
    append = false,
    filter = completedFilter,
  ) => {
    try {
      if (page === 1) {
        setLoadingCompleted(true);
      } else {
        setLoadingMoreCompleted(true);
      }

      let params: any = {};

      if (filter !== "custom") {
        params.dias = Number(filter);
      } else {
        params.oficinaPlaca = customWorkshopPlate;
        params.data_inicial = customDateRange.start;
        params.data_final = customDateRange.end;
      }

      const res = await TechnicianManagementService.getCompletedServices(
        page,
        params,
      );

      const newData = res.data.data;

      setCompletedLastPage(res.data.last_page);
      setCompletedPage(page);

      if (append) {
        setCompletedServices((prev) => [...prev, ...newData]);
      } else {
        setCompletedServices(newData);
      }
    } catch (err) {
      console.log("Erro ao carregar histórico", err);
    } finally {
      setLoadingCompleted(false);
      setLoadingMoreCompleted(false);
    }
  };

  const loadMoreServices = () => {
    if (loadingMoreServices) return;
    if (servicesPage >= servicesLastPage) return;

    loadServices(servicesPage + 1, true, statusFilter);
  };

  const loadMoreCompleted = () => {
    if (loadingMoreCompleted) return;
    if (completedPage >= completedLastPage) return;

    loadCompleted(completedPage + 1, true);
  };

  const handleChangeFilter = async (status: string | null) => {
    let nextFilters: string[];

    if (status === null) {
      nextFilters = [];
    } else {
      const alreadySelected = statusFilter.includes(status);

      nextFilters = alreadySelected
        ? statusFilter.filter((s) => s !== status)
        : [...statusFilter, status];
    }

    setStatusFilter(nextFilters);

    await loadServices(1, false, nextFilters);
  };

  // carregando inicial começa em seviços
  // useFocusEffect(
  //   useCallback(() => {
  //     setTab("services");
  //     setStatusFilter([]);

  //     (async () => {
  //       await loadServices();
  //     })();
  //   }, []),
  // );

  useFocusEffect(
    useCallback(() => {
      const tabParam = route.params?.tab;
      setStatusFilter([]);

      if (tabParam) {
        handleChangeTab(tabParam);
      } else{
        setTab("services");

        (async () => {
          await loadServices();
        })();
      }

      return () => {
        navigation.setParams({
          tab: undefined,
        });
      };
    }, [route.params?.tab])
  );

  // aplica filtro ao digitar
  useEffect(() => {
    if (completedFilter !== "custom") {
      return;
    }

    const timeout = setTimeout(() => {
      loadCompleted(1, false, "custom");
    }, 500);

    return () => clearTimeout(timeout);
  }, [customWorkshopPlate]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <AppHeader
        logo={require("@/assets/binotto-dog-logo-cropped.png")}
        title={t("technicianDashboardScreen.greeting", {
          name: authData?.name,
        })}
        subtitle={t("technicianDashboardScreen.subtitle")}
      />

      <View style={styles.mainContainer}>
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        <TouchableOpacity
          style={styles.requestTechnicianButton}
          onPress={handleOpenCreateService}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
              stroke={colors.black}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={7}
              cy={17}
              r={2}
              stroke={colors.black}
              strokeWidth={2}
            />
            <Path
              d="M9 17h6"
              stroke={colors.black}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Circle
              cx={17}
              cy={17}
              r={2}
              stroke={colors.black}
              strokeWidth={2}
            />
          </Svg>

          <Text style={styles.requestTechnicianButtonText}>
            {t("technicianDashboardScreen.initCar")}
          </Text>
        </TouchableOpacity>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabButton, tab === "services" && styles.activeTab]}
            onPress={() => handleChangeTab("services")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "services" && styles.activeTabText,
              ]}
            >
              {t("technicianDashboardScreen.services")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, tab === "completed" && styles.activeTab]}
            onPress={() => handleChangeTab("completed")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "completed" && styles.activeTabText,
              ]}
            >
              {t("technicianDashboardScreen.completed")}
            </Text>
          </TouchableOpacity>
        </View>

        {tab === "services" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {serviceFilters.map((filter, i) => {
              return (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterButton,
{ minWidth: 72,  
      maxWidth: 72,
    paddingHorizontal: 6},
                    filter.value &&
                      statusFilter.includes(filter.value) && {
                        ...styles.filterButtonActive,
                        borderColor:
                          statusFilter.length == 0
                            ? colors.primary
                            : colorStatus(filter.value, true)
                              ? `${colorStatus(filter.value, true)}60`
                              : colors.primary,
                        backgroundColor:
                          statusFilter.length == 0
                            ? colors.primary
                            : colorStatus(filter.value, true)
                              ? `${colorStatus(filter.value, true)}20`
                              : colors.primary,
                        borderWidth: 1,
                      },
                    i == 0 &&
                      statusFilter.length == 0 && {
                        borderColor: colors.primary,
                        backgroundColor: colors.primary,
                      },
                  ]}
                  onPress={() => {
                    handleChangeFilter(filter.value);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter.value && statusFilter.includes(filter.value)
                        ? {
                            ...styles.filterButtonTextActive,
                            color:
                              filter.value === "todos"
                                ? colors.black
                                : (colorStatus(filter.value, true) ??
                                  undefined),
                          }
                        : i == 0 && statusFilter.length == 0
                          ? { color: colors.black }
                          : { color: colors.textMuted },
                    ]}
                    numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.7}
  ellipsizeMode="tail"
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* FILTROS */}
        {tab === "completed" && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContainer}
            >
              {completedFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterButton,{ minWidth: 80,  
      maxWidth: 80,
    paddingHorizontal: 4},
                    completedFilter === filter.value &&
                      styles.filterButtonActive,
                  ]}
                  onPress={async () => {
                    if (
                      completedFilter === "custom" &&
                      completedFilter === filter.value
                    ) {
                      return;
                    }

                    setCustomWorkshopPlate("");
                    setCustomDateRange({ start: null, end: null });
                    setCompletedFilter(filter.value as any);
                    await loadCompleted(1, false, filter.value as any);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      completedFilter === filter.value &&
                        styles.filterButtonTextActive,
                    ]}
                        numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.7}
  ellipsizeMode="tail"
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {completedFilter === "custom" && (
              <View style={{ marginTop: 12, paddingHorizontal: 20, gap: 12 }}>
                <SearchDateRangeInput
                  value={customDateRange}
                  onChange={setCustomDateRange}
                  onConfirm={handleCustomDateConfirm}
                  buttonText={t("common.confirm")}
                  placeholder={t(
                    "technicianDashboardScreen.searchDatePlaceholder",
                  )}
                />

                <SearchInput
                  placeholder={t(
                    "technicianDashboardScreen.searchWorkshopOrPlate",
                  )}
                  value={customWorkshopPlate}
                  onChangeText={setCustomWorkshopPlate}
                />
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.listContainer}>
        {tab === "services" && (
          <FlatList
            data={services}
            keyExtractor={(item, index) => item.id + "-" + index}
            refreshing={loadingServices}
            onRefresh={() => loadServices(1, false, statusFilter)}
            onEndReached={loadMoreServices}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMoreServices ? (
                <ActivityIndicator color={colors.primary} />
              ) : null
            }
            ListEmptyComponent={
              !loadingServices ? (
                <Text
                  style={{
                    color: colors.textMuted,
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  {t("technicianDashboardScreen.noServices")}
                </Text>
              ) : null
            }
            renderItem={({ item: service }) => {
              return (
                <ServiceCardTechnician
                  service={service}
                  locale={locale}
                  technicianId={authData?.profileId}
                  loadingFinish={loadingFinish}
                  onPress={(serviceId) => {
                    if (service.status === "em_execucao") {
                      navigation.navigate("ServiceExecution", {
                        serviceId,
                      });

                      return;
                    }

                    if (service.status === "aceito") {
                      navigation.navigate("ServiceAccept", {
                        serviceId,
                      });

                      return;
                    }

                    navigation.navigate("ServiceDetail", {
                      serviceId,
                    });
                  }}
                  onAccept={handleOpenAcceptModal}
                  onReject={handleOpenRejectModal}
                  onFinish={handleOpenFinishModal}
                  t={t}
                />
            )}}
          />
        )}

        {tab === "completed" && (
          <FlatList
            data={completedServices}
            keyExtractor={(item, index) => item.id + "-" + index}
            refreshing={loadingCompleted}
            onRefresh={() => loadCompleted(1, false)}
            onEndReached={loadMoreCompleted}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMoreCompleted ? (
                <ActivityIndicator color={colors.primary} />
              ) : null
            }
            ListEmptyComponent={
              !loadingCompleted ? (
                <Text
                  style={{
                    color: colors.textMuted,
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  {t("technicianDashboardScreen.noCompletedFound")}
                </Text>
              ) : null
            }
            renderItem={({ item: service }) => (
              <ListCard
                onPress={() => {
                  navigation.navigate("CompleteCar", {
                    serviceId: Number(service.id),
                  });
                }}
                leftContent={<Wrench size={18} color={colors.primary} />}
                title={formatDate(service.data_inicio)}
                subtitle={service.placa || ""}
                rightContent={
                  <Text style={styles.historyPrice}>
                    {formatCurrency(service.valor_total, service.moeda, locale)}
                  </Text>
                }
                body={
                  <View style={styles.historyBody}>
                    <View style={styles.historyLeft}>
                      <View style={{ flexDirection: "row" }}>
                        <Calendar size={16} color={colors.textMuted} />
                        <Text style={styles.historyDate}>
                          {formatDate(service.data_inicio)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyPlate}>
                      {service.placa || ""}
                    </Text>
                    <Text style={styles.historyPrice}>
                      {formatCurrency(
                        service.valor_total,
                        service.moeda,
                        locale,
                      )}
                    </Text>
                  </View>
                }
              />
            )}
          />
        )}
      </View>

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

      {/* MODAL DE CONFIRMAÇÃO DE FINALIZAR SERVIÇO */}
      <ConfirmModal
        visible={finishModalVisible}
        textAlign="left"
        title={t("common.finishServiceTitle")}
        subtitle={t("common.finishServiceSubtitle")}
        variant="double"
        confirmText={t("common.yes")}
        cancelText={t("common.no")}
        onConfirm={handleConfirmFinish}
        onCancel={handleCancelFinish}
        loading={loadingFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  mainContainer: {
    marginBottom: 24,
    marginHorizontal: -8,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    paddingHorizontal: 12,
  },

  searchIcon: {
    position: "absolute",
    left: 10,
    backgroundColor: "#141414",
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    marginLeft: 23,
    color: colors.text,
  },

  filtersContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },

  filterButton: {
    height: 27,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    justifyContent: "center",
    alignItems: "center",
  },

  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  filterButtonTextActive: {
    color: colors.black,
  },

  listContainer: {
    flex: 1,
  },

  requestTechnicianButton: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  requestTechnicianButtonText: {
    color: colors.black,
    fontWeight: "700",
    fontSize: 16,
  },

  contactRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
  },

  whatsappBtn: {
    flex: 1,
    backgroundColor: "#052e1d",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  phoneBtn: {
    flex: 1,
    backgroundColor: "#3b2f05",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  whatsappText: {
    color: "#34d399",
    fontWeight: "600",
  },

  phoneText: {
    color: colors.primary,
    fontWeight: "600",
  },

  tabs: {
    flexDirection: "row",
    marginTop: 18,
    marginHorizontal: 20,
    backgroundColor: colors.backgroundSurface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },

  tabButton: {
    flex: 1,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },

  activeTab: {
    backgroundColor: colors.background,
  },

  tabText: {
    color: colors.textMuted,
    fontWeight: "600",
  },

  activeTabText: {
    color: colors.primary,
    fontWeight: "400",
  },

  historyCard: {
    backgroundColor: colors.backgroundSurface,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  historyBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  historyLeft: {
    justifyContent: "space-between",
    alignItems: "center",
  },

  historyDate: {
    color: "#999",
    marginLeft: 10,
  },

  historyPlate: {
    flex: 1,
    textAlign: "center",
    color: colors.white,
    fontWeight: "600",
  },

  historyPrice: {
    color: colors.white,
    fontWeight: "700",
  },
});
