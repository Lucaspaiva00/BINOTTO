import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";
import AppHeader from "@/components/common/AppHeader";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate } from "@/utils/date";
import { Calendar } from "react-native-calendars";
import TechnicianInspectionService from "@/services/TechnicianInspectionService";
import dayjs from "dayjs";
import { Car, FileDown, Search } from "lucide-react-native";
import ListCard from "@/components/common/ListCard";
import { formatCurrency } from "@/utils/currency";
import TechnicianManagementService from "@/services/TechnicianManagementService";
import SecureStorageService from "../../services/SecureStorageService";
import PdfActionModal from "@/components/common/PdfActionModal";
import { GLOBAL } from "@/constants/global";
import { DateRangeValue, SearchDateRangeInput } from "@/components/common/SearchDateRangeInput";
import { SearchInput } from "@/components/common/SearchInput";

export default function TechnicianInspectionsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { locale } = useLanguage();

  // data states
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStartCar, setLoadingStartCar] = useState<boolean>(false);
  const [loadingGeneratePdf, setLoadingGeneratePdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [pdfFileUri, setPdfFileUri] = useState<string | null>(null);

  // filters
  const [statusFilter, setStatusFilter] = useState<
    "todas" | "aberta" | "em_execucao" | "concluida" | "custom"
  >("todas");
  const [customWorkshopPlate, setCustomWorkshopPlate] = useState("");
  const [customDateRange, setCustomDateRange] = useState<DateRangeValue>({
    start: null,
    end: null,
  });

  // paginação
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const changeStatusFilter = (
    status: "todas" | "aberta" | "em_execucao" | "concluida" | "custom",
  ) => {
    setStatusFilter(status);

    if(status !== "custom") {
      setCustomDateRange({ start: null, end: null });
      setCustomWorkshopPlate("");
    }

    loadInspections(1, false, status);
  };

  // functions
  const resetFilters = () => {
    setStatusFilter("todas");
    setCustomDateRange({ start: null, end: null });
    setCustomWorkshopPlate("");
  };

  const handleCustomDateConfirm = async () => {
    if (!customDateRange.start && !customDateRange.end) {
      return;
    }

    await loadInspections(1, false, "custom");
  };

  const loadMore = () => {
    if (loadingMore) return;
    if (page >= lastPage) return;

    loadInspections(page + 1, true, statusFilter);
  };

  const handleOpenNewInspection = async () => {
    navigation.navigate("NewInspection");
  };

  // requests
  const handleGeneratePdf = async (inspectionId: number) => {
    try {
      setLoadingGeneratePdf(true);

      const token = await SecureStorageService.getToken();
      Linking.openURL(
        `${GLOBAL.baseURL}/tecnico/pericias/${inspectionId}/pdf?token=${token}`,
      );
    } catch (error) {
      setError(t("technicianInspectionsScreen.pdfGenerateError"));
    } finally {
      setLoadingGeneratePdf(false);
    }
  };

  const handleStartCarFromInspection = async (inspectionId: number) => {
    try {
      setError("");
      setLoadingStartCar(true);

      const response =
        await TechnicianManagementService.startServiceFromInspection(
          inspectionId,
        );

      navigation.navigate("ServiceExecution", {
        serviceId: response.data.id,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("technicianInspectionsScreen.startCarError");

      setError(message);
    } finally {
      setLoadingStartCar(false);
    }
  };

  const loadInspections = async (
    page: number = 1,
    append: boolean = false,
    statusParam?: "todas" | "aberta" | "em_execucao" | "concluida" | "custom" | null,
  ) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      const statusToSend =
        statusParam !== undefined ? statusParam : statusFilter;

      let params: any = {};

      if (statusParam === "custom") {
        params.oficina_placa = customWorkshopPlate;
        params.data_inicial = customDateRange.start;
        params.data_final = customDateRange.end;
      }

      const response =
        await TechnicianInspectionService.getTechnicianInspection(
          page,
          statusToSend === "todas" ? null : statusToSend,
          params
        );

      const pagination = response.data;
      const newData = pagination.data;

      setLastPage(pagination.last_page);
      setPage(page);

      if (append) {
        setInspections((prev) => [...prev, ...newData]);
      } else {
        setInspections(newData);
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      resetFilters();
      loadInspections();
    }, []),
  );

  // aplica filtro ao digitar
  useEffect(() => {
    if (statusFilter !== "custom") {
      return;
    }

    const timeout = setTimeout(() => {
      loadInspections(1, false, "custom");
    }, 500);

    return () => clearTimeout(timeout);
  }, [customWorkshopPlate]);

  const FilterStatusButton = ({
    label,
    value,
  }: {
    label: string;
    value: "todas" | "aberta" | "em_execucao" | "concluida" | "custom";
  }) => (
    <TouchableOpacity
      onPress={() => changeStatusFilter(value)}
      style={[
        styles.filterButton,{ minWidth: 80,  
      maxWidth: 80,
    paddingHorizontal: 6,alignItems:"center"},
        statusFilter === value && styles.activeFilterButton,
      ]}
    >
      <Text
        style={[
          styles.filterButtonText,
          statusFilter === value && styles.activeFilterButtonText,
        ]}
         numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.7}
  ellipsizeMode="tail"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={{
          flex: 1,

          backgroundColor: colors.background,
        }}
      >
        {/* HEADER */}
        <AppHeader
          logo={require("@/assets/binotto-dog-logo-cropped.png")}
          title={t("technicianInspectionsScreen.title")}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.mainContainer}>
          <TouchableOpacity
            style={styles.newInspectionButton}
            onPress={handleOpenNewInspection}
          >
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color={colors.black}
            />
            <Text style={styles.newInspectionButtonText}>
              {t("technicianInspectionsScreen.newInspection")}
            </Text>
          </TouchableOpacity>

          {/* FILTERS */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            <View style={styles.filtersRow}>
              <FilterStatusButton
                label={t("inspectionStatus.all")}
                value="todas"
              />
              <FilterStatusButton
                label={t("common.inspectionStatus.open")}
                value="aberta"
              />
              <FilterStatusButton
                label={t("common.inspectionStatus.inProgress")}
                value="em_execucao"
              />
              <FilterStatusButton
                label={t("common.inspectionStatus.closed")}
                value="concluida"
              />
              <FilterStatusButton
                label={t("technicianInspectionsScreen.custom")}
                value="custom"
              />
            </View>
          </ScrollView>

          {statusFilter === "custom" && (
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

        {/* LIST */}
        <View style={styles.listContainer}>
          <FlatList
            refreshing={loading}
            onRefresh={() => loadInspections(1, false, statusFilter)}
            data={inspections}
            keyExtractor={(item) => String(item.id)}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={{
              paddingBottom: 40,
            }}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.emptyText}>
                  {t("technicianInspectionsScreen.noInspections")}
                </Text>
              ) : null
            }
            ListFooterComponent={
              loadingMore ? <ActivityIndicator color={colors.primary} /> : null
            }
            renderItem={({ item }) => {
              let statusColor = "#34d399";
              let statusLabel = t("common.inspectionStatus.open");

              if (item.status === "em_execucao") {
                statusColor = colors.warning;
                statusLabel = t("common.inspectionStatus.inProgress");
              }

              if (item.status === "concluida") {
                statusColor = "#60A5FA";
                statusLabel = t("common.inspectionStatus.closed");
              }

              return (
                <ListCard
                  onPress={() => {
                    navigation.navigate("InspectionDetail", {
                      inspectionId: item.id,
                      backTo: "Inspections",
                    });
                  }}
                  body={
                    <View style={styles.cardCustomBody}>
                      <View style={styles.cardRow}>
                        <Text style={styles.workshopNameText} numberOfLines={1}>
                          {item.oficina?.nome_fantasia || "--"}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: `${statusColor}20`,
                              borderColor: `${statusColor}60`,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: statusColor },
                            ]}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardRow}>
                        <Text style={styles.plateText}>
                          {item.placa || "--"}
                        </Text>
                        <Text style={styles.carModelText} numberOfLines={1}>
                          {item.marca_modelo || ""}
                        </Text>
                      </View>

                      <View style={styles.cardRow}>
                        <Text style={styles.dateText}>
                          {item.created_at
                            ? formatDate(item.created_at, locale)
                            : "--/--/----"}
                        </Text>
                        <Text style={styles.priceText}>
                          {item.valor_pericia
                            ? formatCurrency(
                                item.valor_pericia,
                                item.moeda,
                                locale,
                              )
                            : ""}
                        </Text>
                      </View>

                     {item.servico_id && item.status === "em_execucao" ? (
                        <View style={styles.cardRow}>
                          <Text
                            style={{
                              ...styles.dateText,
                              color: colors.warning,
                              fontWeight:"400",
                              fontStyle: "italic",
                            }}
                          >
                           {t("technicianInspectionsScreen.alreadyLinkedToExecution")}
                          </Text>
                        </View>
                      ) : undefined}

                      {/* INICIA CARRO */}
                      {/* {item.status === "aberta" && (
                        <TouchableOpacity
                          style={styles.actionButtonPrimary}
                          activeOpacity={0.8}
                          onPress={() =>
                            handleStartCarFromInspection(Number(item.id))
                          }
                          disabled={loadingStartCar}
                        >
                          {loadingStartCar ? (
                            <ActivityIndicator
                              size="small"
                              color={colors.black}
                            />
                          ) : (
                            <>
                              <Car size={16} color={colors.black} />
                              <Text style={styles.actionButtonPrimaryText}>
                                {t(
                                  "technicianInspectionsScreen.startCarButton",
                                )}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )} */}

                      {/* {item.status === "concluida" && (
                        <TouchableOpacity
                          style={styles.actionButtonOutline}
                          activeOpacity={0.8}
                          onPress={() => handleGeneratePdf(Number(item.id))}
                        >
                          <FileDown size={16} color={colors.white} />
                          <Text style={styles.actionButtonOutlineText}>
                            {t(
                              "technicianInspectionsScreen.viewInspectionPdfButton",
                            )}
                          </Text>
                        </TouchableOpacity>
                      )} */}
                    </View>
                  }
                  leftContent={undefined}
                  title={undefined}
                />
              );
            }}
          />
        </View>
      </View>

      <PdfActionModal
        navigation={navigation}
        visible={pdfModalVisible}
        pdfFileUri={pdfFileUri}
        onClose={() => {
          setPdfModalVisible(false);
          setPdfFileUri(null);
        }}
        loading={loadingGeneratePdf}
        setError={setError}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    marginBottom: 24,
    marginHorizontal: -10,
  },

  listContainer: {
    flex: 1,
    marginHorizontal: -10,
  },

  newInspectionButton: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },

  newInspectionButtonText: {
    color: colors.black,
    fontWeight: "700",
    fontSize: 16,
  },
  filtersScrollContent: {},

  filtersRow: {
    flexDirection: "row",
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 16,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: colors.backgroundSurface,
    borderColor: colors.white,
  },

  filterButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  activeFilterButtonText: {
    color: colors.white,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    marginHorizontal: 20,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    paddingHorizontal: 12,
  },

  searchIcon: {
    position: "absolute",
    backgroundColor: "#141414",
    left: 10,
    top: 12,
    zIndex: 1,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    marginLeft: 23,
    fontWeight: "700",
    color: colors.text,
  },

  dateText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },

  calendarWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },

  confirmButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  confirmText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },

  cardCustomBody: {
    gap: 1,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workshopNameText: {
    color: "white",
    fontSize: 14,
    fontWeight: "300",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 0.5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  plateText: {
    color: colors.white || "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  carModelText: {
    color: colors.textMuted || "#aaa",
    fontSize: 14,
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },

  priceText: {
    color: colors.white || "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  alertText: {
    color: "#e67e22",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },

  actionButtonPrimary: {
    backgroundColor: colors.primary || "#f1c40f",
    borderRadius: 12,
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  actionButtonPrimaryText: {
    color: colors.black || "#000",
    fontWeight: "700",
    fontSize: 14,
  },
  // Estilo do Botão Outline (Visualizar PDF)
  actionButtonOutline: {
    backgroundColor: "transparent",
    borderRadius: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderMutedCard || "#333",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  actionButtonOutlineText: {
    color: colors.white || "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
