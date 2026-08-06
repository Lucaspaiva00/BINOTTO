import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import {  useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/theme/colors";
import AppHeader from "@/components/common/AppHeader";
import WorkshopManagementService from "@/services/WorkshopManagementService";
import { formatDate, formatHour } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStatusLabelKey, statusDotStyles } from "@/utils/status";
import AddressRequiredModal from "@/components/common/AddressRequiredModal";
import ListCard from "@/components/common/ListCard";
import {
  Calendar,
  Car,
  Clock,
  MessageCircle,
  MessageSquareText,
  Phone,
  Search,
  Wrench,
} from "lucide-react-native";
import { colorStatus } from "@/services/ColorStatusService";
import { DateRangeValue, SearchDateRangeInput } from "@/components/common/SearchDateRangeInput";
import { SearchInput } from "@/components/common/SearchInput";

export default function WorkshopDashboardScreen() {
  const { locale } = useLanguage();
  const { authData } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // states
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [historyServices, setHistoryServices] = useState<any[]>([]);
  const [serviceCreatedId, setServiceCreatedId] = useState<number | null>(null);
  const [hasPreferredTechs, setHasPreferredTechs] = useState(false);

  // utils
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [creatingService, setCreatingService] = useState(false);
  const [plateSearch, setPlateSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>("");
  const [showAddressRequiredModal, setShowAddressRequiredModal] =
    useState(false);

  // paginação
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingLastPage, setPendingLastPage] = useState(1);
  const [loadingMorePending, setLoadingMorePending] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLastPage, setHistoryLastPage] = useState(1);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

  // contatos do suporte
  const phoneSuporte = "+39 348 421 7201";
  const whatsappSuporte = "393484217201";

    useEffect(() => {
    loadPendentes(1, false);
  }, []);

  

  const handleConfirmModal = () => {
    setShowModal(false);

    if (serviceCreatedId) {
      navigation.navigate("ServiceUpdate", {
        serviceId: serviceCreatedId,
      });
    }
  };

  const handleOpenServiceUpdate = (serviceId: number) => {
    navigation.navigate("ServiceUpdate", {
      serviceId: serviceId,
    });
  };

  const handleOpenDetails = (serviceId: number) => {
    navigation.navigate("ServiceDetail", {
      serviceId: serviceId,
    });
  };

  const handleOpenServiceConfirm = async (serviceId: number) => {
    navigation.navigate("ServiceConfirm", {
      serviceId: serviceId,
    });
  };

  const handleChangeTab = async (value: "pending" | "history") => {
    setTab(value);

    if (value === "pending") {
      await loadPendentes(1, false);
    }

    if (value === "history") {
      await loadHistorico(1, false);
    }
  };

  // requests
  const handleCreateService = async () => {
    try {
      if (!authData?.canRequestTechnician) {
        setShowAddressRequiredModal(true);
        return;
      }

      setShowModal(true);
      setCreatingService(true);

      const res = await WorkshopManagementService.createWorkshopService({});
      const serviceId = res.data.id;
      const possuiPreferidos = res.possuiPreferidos;

      setServiceCreatedId(serviceId);
      setHasPreferredTechs(possuiPreferidos);
    } catch (err) {
      console.log("Erro ao criar serviço", err);
    } finally {
      setCreatingService(false);
    }
  };

  const loadPendentes = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoadingPending(true);
      } else {
        setLoadingMorePending(true);
      }

      const res = await WorkshopManagementService.getPendingServices(page);
      const newData = res.data.data;

      setPendingLastPage(res.data.last_page);
      setPendingPage(page);

      if (append) {
        setPendingServices((prev) => [...prev, ...newData]);
      } else {
        setPendingServices(newData);
      }
    } catch (err) {
      console.log("Erro pendentes", err);
    } finally {
      setLoadingPending(false);
      setLoadingMorePending(false);
    }
  };

  const loadHistorico = async (page = 1, append = false,  filter = completedFilter) => {
    try {
      if (page === 1) {
        setLoadingHistory(true);
      } else {
        setLoadingMoreHistory(true);
      }

        let params: any = {};

      if (filter !== "custom") {
        params.dias = Number(filter);
      } else {
        params.oficinaPlaca = customWorkshopPlate;
        params.data_inicial = customDateRange.start;
        params.data_final = customDateRange.end;
      }

      const res = await WorkshopManagementService.getServiceHistory(page,params);
      const newData = res.data.data;

      setHistoryLastPage(res.data.last_page);
      setHistoryPage(page);

      if (append) {
        setHistoryServices((prev) => [...prev, ...newData]);
      } else {
        setHistoryServices(newData);
      }
    } catch (err) {
      console.log("Erro ao carregar histórico", err);
    } finally {
      setLoadingHistory(false);
      setLoadingMoreHistory(false);
    }
  };

  const loadMorePendentes = () => {
    if (loadingMorePending) return;
    if (pendingPage >= pendingLastPage) return;

    loadPendentes(pendingPage + 1, true);
  };

  const loadMoreHistorico = () => {
    if (loadingMoreHistory) return;
    if (historyPage >= historyLastPage) return;

    loadHistorico(historyPage + 1, true);
  };

      const handleCustomDateConfirm = async () => {
    if (!customDateRange.start && !customDateRange.end) {
      return;
    }
    await loadHistorico(1, false, "custom");
  };

  // aplica filtro ao digitar
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

  // filter completed
  useEffect(() => {
    if (completedFilter !== "custom") {
      return;
    }

    const timeout = setTimeout(() => {
      loadHistorico(1, false, "custom");
    }, 500);

    return () => clearTimeout(timeout);
  }, [customWorkshopPlate]);

  // carregando inicial começa em pendentes, exceto se vier uma tab via params
  useFocusEffect(
    useCallback(() => {
      const tabParam = route.params?.tab;

      if (tabParam) {
        handleChangeTab(tabParam as "pending" | "history");
      } else {
        setTab("pending");

        (async () => {
          await loadPendentes();
        })();
      }

      return () => {
        navigation.setParams({
          tab: undefined,
        });
      };
    }, [route.params?.tab])
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View style={styles.mainContainer}>
        {/* HEADER */}
        <AppHeader
          logo={require("@/assets/binotto-dog-logo-cropped.png")}
          title={authData?.name}
          subtitle={t("workshopDashboardScreen.subtitle")}
        />

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* BOTÃO PRINCIPAL*/}
        <TouchableOpacity
          style={styles.requestTechnicianButton}
          onPress={handleCreateService}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.black} />
          <Text style={styles.requestTechnicianButtonText}>
            {t("workshopDashboardScreen.requestTechnician")}
          </Text>
        </TouchableOpacity>

        {/* CONTATOS */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => Linking.openURL(`https://wa.me/${whatsappSuporte}`)}
          >
            <MessageCircle size={20} color="#34d399" />
            <Text style={styles.whatsappText}>
              {t("workshopDashboardScreen.whatsapp")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.phoneBtn}
            onPress={() => Linking.openURL(`tel:${phoneSuporte}`)}
          >
            <Phone size={20} color={colors.primary} />
            <Text style={styles.phoneText}>
              {t("workshopDashboardScreen.phone")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabButton, tab === "pending" && styles.activeTab]}
            onPress={() => handleChangeTab("pending")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "pending" && styles.activeTabText,
              ]}
            >
              {t("workshopDashboardScreen.pending")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, tab === "history" && styles.activeTab]}
            onPress={() => handleChangeTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "history" && styles.activeTabText,
              ]}
            >
              {t("workshopDashboardScreen.history")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Listas */}
      <View style={styles.listContainer}>
        {tab === "pending" && (
          <FlatList
            data={pendingServices}
            keyExtractor={(item, index) => item.id + "-" + index}
            refreshing={loadingPending}
            onRefresh={() => loadPendentes(1, false)}
            onEndReached={loadMorePendentes}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMorePending ? (
                <ActivityIndicator color={colors.primary} />
              ) : null
            }
            ListEmptyComponent={
              !loadingPending ? (
                <Text
                  style={{
                    color: colors.textMuted,
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  {t("workshopDashboardScreen.noPendingServices")}
                </Text>
              ) : null
            }
            renderItem={({ item: service }) => {
              const statusColor =
                statusDotStyles[service.status as keyof typeof statusDotStyles]
                  ?.dotColor ?? "#999";
              const isFinalizado = service.status === "finalizado";

              return (
                <ListCard
                  onPress={() =>
                    isFinalizado?{}:
                    service.status == "em_breve"
                      ? handleOpenServiceUpdate(Number(service.id))
                      : handleOpenDetails(Number(service.id))
                  }
                  leftContent={<Wrench size={18} color={colors.primary} />}
                  title={service.oficina_label ?? null}
                  rightContent={ <View
                    style={[
                                          styles.badge,
                                          {
                                            borderWidth: 1,
                  
                                            backgroundColor: `${colorStatus(service.status)}20`,
                                            borderColor: colorStatus(service.status)
                                              ? `${colorStatus(service.status)}60`
                                              : colors.primary,
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
                  }
                  metaItems={
                    isFinalizado
                    ?[]:
                    [
                    {
                      key: "date",
                      node: (
                        <>
                          <Calendar size={16} color="#aaa" />
                          <Text style={styles.infoText}>
                            {service.data_inicio
                              ? formatDate(service.data_inicio)
                              : "--"}
                          </Text>
                        </>
                      ),
                    },
                    {
                      key: "arrival",
                      node: (
                        <>
                          <Clock size={16} color="#aaa" />
                          <Text style={styles.infoText}>
                            {service.horario_previsto_chegada
                              ? formatHour(service.horario_previsto_chegada)
                              : "--"}
                          </Text>
                        </>
                      ),
                    },
                    {
                      key: "quantity",
                      node: (
                        <>
                          {service.quantidade_tipo === "carros" ? (
                            <Car size={16} color="#aaa" strokeWidth={2} />
                          ) : (
                            <Calendar size={16} color="#aaa" strokeWidth={2} />
                          )}
                          <Text style={styles.infoText}>
                            {service.quantidade ? service.quantidade : "--"}
                          </Text>
                        </>
                      ),
                    },
                    {
                      key: "price",
                      node: (
                        <Text style={styles.infoText}>
                          {formatCurrency(
                            service.valor_total,
                            service.moeda,
                            locale,
                          )}
                        </Text>
                      ),
                    },
                  ]}
                  footer={
                    isFinalizado ? (
                      <TouchableOpacity
                        style={styles.fullButton}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation?.();
                         handleOpenServiceConfirm(service.id);
                        }}
                      >
                        <Text style={styles.fullButtonText}>
                          {t("workshopDashboardScreen.confirm")}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                />
              );
            }}
          />
        )}

        {tab === "history" && (
          <FlatList
            data={historyServices}
            keyExtractor={(item, index) => item.id + "-" + index}
            refreshing={loadingHistory}
            onRefresh={() => loadHistorico(1, false)}
            onEndReached={loadMoreHistorico}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={
               <View style={{marginBottom:18}}>
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
                                await loadHistorico(1, false, filter.value as any);
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
                      </View>
            }
            ListFooterComponent={
              loadingMoreHistory ? (
                <ActivityIndicator color={colors.primary} />
              ) : null
            }
            ListEmptyComponent={
              !loadingHistory ? (
                <Text
                  style={{
                    color: colors.textMuted,
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  {t("workshopDashboardScreen.noHistoryFound")}
                </Text>
              ) : null
            }
            renderItem={({ item: service }) => (
              <ListCard
                onPress={() => handleOpenDetails(Number(service.id))}
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
                      <Wrench size={18} color={colors.primary} />
                      <View>
                        <Text style={styles.historyDate}>
                          {formatDate(service.data_inicio)}
                        </Text>
                      </View>
                      <Text style={styles.historyPlate}>
                        {service.placa || ""}
                      </Text>
                    </View>
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

      {/* MODAL */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleConfirmModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {creatingService ? (
              <>
                <Text style={styles.modalTitle}>
                  {t("workshopDashboardScreen.creatingRequest")}
                </Text>

                <Text style={styles.modalText}>
                  {t("workshopDashboardScreen.waitAMoment")}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  {t("workshopDashboardScreen.requestCreatedTitle")}
                </Text>

                <Text style={styles.modalText}>
                  {hasPreferredTechs
                    ? t("workshopDashboardScreen.preferredTechsNotified")
                    : t("workshopDashboardScreen.techniciansNotified")}
                </Text>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleConfirmModal}
                >
                  <Text style={styles.modalButtonText}>
                    {t("workshopDashboardScreen.advance")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      <AddressRequiredModal
        visible={showAddressRequiredModal}
        onClose={() => setShowAddressRequiredModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  mainContainer: {
    marginBottom: 24,
  },

  listContainer: {
    flex: 1,
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

  requestTechnicianButton: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  requestTechnicianButtonText: {
    color: colors.black,
    fontWeight: "700",
    fontSize: 16,
  },

  contactRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 12,
    marginTop: 16,
  },

  whatsappBtn: {
    flex: 1,
    borderColor: "#1b523d",
    borderWidth: 1,
    backgroundColor: "#052e1d",
    borderRadius: 14,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  phoneBtn: {
    flex: 1,
    borderColor: "#664a19",
    borderWidth: 1,
    backgroundColor: "#3b2f05",
    borderRadius: 14,
    height: 50,
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

  // Tabs
  tabs: {
    flexDirection: "row",
    marginTop: 24,
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
    color: colors.white,
    fontWeight: "400",
  },

  card: {
    // backgroundColor: colors.backgroundSurface,
    backgroundColor: colors.card_item,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardTitle: {
    color: colors.white,
    fontWeight: "600",
    flexShrink: 1,
    maxWidth: "80%",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    alignItems: "center",
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  infoText: {
    color: colors.textMuted,
    fontSize: 14,
  },

  price: {
    color: colors.white,
    fontWeight: "700",
  },

  fullButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  fullButtonText: {
    color: colors.black,
    fontWeight: "800",
    fontSize: 14,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
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
    color: "#999",
    fontWeight: "400",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modal: {
    backgroundColor: colors.backgroundSurface,
    width: "100%",
    borderRadius: 20,
    padding: 24,
  },

  modalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },

  modalText: {
    color: colors.textMuted,
    marginTop: 10,
    lineHeight: 22,
  },

  modalButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  modalButtonText: {
    color: colors.black,
    fontWeight: "700",
    fontSize: 16,
  },
});
