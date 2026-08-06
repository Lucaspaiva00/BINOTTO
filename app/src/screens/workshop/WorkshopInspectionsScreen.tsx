import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";
import AppHeader from "@/components/common/AppHeader";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDate } from "@/utils/date";
import ListCard from "@/components/common/ListCard";
import { formatCurrency } from "@/utils/currency";
import { DateRangeValue, SearchDateRangeInput } from "@/components/common/SearchDateRangeInput";
import { SearchInput } from "@/components/common/SearchInput";
import WorkshopManagementService from "@/services/WorkshopManagementService";

export default function WorkshopInspectionsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { locale } = useLanguage();

  // Data states
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "todas" | "aberta" | "em_execucao" | "concluida" | "custom"
  >("todas");
  const [customWorkshopPlate, setCustomWorkshopPlate] = useState("");
  const [customDateRange, setCustomDateRange] = useState<DateRangeValue>({
    start: null,
    end: null,
  });

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("todas");
    setCustomDateRange({ start: null, end: null });
    setCustomWorkshopPlate("");
  };

  // Load inspections
  const loadInspections = async (
    pageNum: number = 1,
    append: boolean = false,
    statusParam?: typeof statusFilter
  ) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const statusToSend =
        statusParam !== undefined ? statusParam : statusFilter;

      let params: any = {};

      if (statusToSend === "custom") {
        params.oficina_placa = customWorkshopPlate;
        params.data_inicial = customDateRange.start;
        params.data_final = customDateRange.end;
      }

      const response = await WorkshopManagementService.getWorkshopInspections(
        pageNum,
        statusToSend === "todas" ? null : statusToSend,
        params
      );

      const pagination = response.data;
      const newData = pagination.data;

      setLastPage(pagination.last_page);
      setPage(pageNum);

      if (append) {
        setInspections((prev) => [...prev, ...newData]);
      } else {
        setInspections(newData);
      }
    } catch (err) {
      setError(t("workshopInspectionsScreen.loadError"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Change status filter
  const changeStatusFilter = (
    status: "todas" | "aberta" | "em_execucao" | "concluida" | "custom"
  ) => {
    setStatusFilter(status);
    if (status !== "custom") {
      setCustomDateRange({ start: null, end: null });
      setCustomWorkshopPlate("");
    }
    loadInspections(1, false, status);
  };

  // Custom date confirm
  const handleCustomDateConfirm = () => {
    if (!customDateRange.start && !customDateRange.end) {
      return;
    }
    loadInspections(1, false, "custom");
  };

  // Load more on end reached
  const loadMore = () => {
    if (loadingMore || page >= lastPage) return;
    loadInspections(page + 1, true, statusFilter);
  };

  // Refresh
  const onRefresh = () => {
    loadInspections(1, false, statusFilter);
  };

  // Auto-search when typing in custom filter
  useEffect(() => {
    if (statusFilter !== "custom") return;
    const timeout = setTimeout(() => {
      loadInspections(1, false, "custom");
    }, 500);
    return () => clearTimeout(timeout);
  }, [customWorkshopPlate, customDateRange]);

  // Reset filters on screen focus
  useFocusEffect(
    useCallback(() => {
      resetFilters();
      loadInspections(1, false, "todas");
    }, [])
  );

  // Filter button component
  const FilterStatusButton = ({
    label,
    value,
  }: {
    label: string;
    value: typeof statusFilter;
  }) => (
    <TouchableOpacity
      onPress={() => changeStatusFilter(value)}
      style={[
        styles.filterButton,
        { minWidth: 80, maxWidth: 80, paddingHorizontal: 6, alignItems: "center" },
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

  // Render item
  const renderItem = ({ item }: { item: any }) => {
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
        onPress={() =>
        {

            if(item.status == "em_execucao"){

               navigation.navigate("ServiceConfirm", {
     serviceId: item.servico_id,
    });

            }else{
           navigation.navigate("InspectionDetails", {
      serviceId: item.id,
    });
  }
        }
        }
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
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.plateText}>{item.placa || "--"}</Text>
              <Text style={styles.carModelText} numberOfLines={1}>
                {item.marca_modelo || ""}
              </Text>
            </View>

            <View style={styles.cardRow}>
              <Text style={styles.dateText}>
                {item.created_at ? formatDate(item.created_at, locale) : "--/--/----"}
              </Text>
              <Text style={styles.priceText}>
                {item.valor_pericia
                  ? formatCurrency(item.valor_pericia, item.moeda, locale)
                  : ""}
              </Text>
            </View>
          </View>
        }
        leftContent={undefined}
        title={undefined}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.mainContainer}>
          <AppHeader
            logo={require("@/assets/binotto-dog-logo-cropped.png")}
            title={t("workshopInspectionsScreen.title")}
            onBack={() => navigation.goBack()}
          />

   <TouchableOpacity
            style={styles.newInspectionButton}
            onPress={()=>{
                navigation.navigate("NewInspection");
            }}
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
              <FilterStatusButton label={t("inspectionStatus.all")} value="todas" />
              <FilterStatusButton label={t("common.inspectionStatus.open")} value="aberta" />
              <FilterStatusButton label={t("common.inspectionStatus.inProgress")} value="em_execucao" />
              <FilterStatusButton label={t("common.inspectionStatus.closed")} value="concluida" />
              <FilterStatusButton label={t("workshopInspectionsScreen.custom")} value="custom" />
            </View>
          </ScrollView>

          {statusFilter === "custom" && (
            <View style={{ marginTop: 12, paddingHorizontal: 20, gap: 12 }}>
              <SearchDateRangeInput
                value={customDateRange}
                onChange={setCustomDateRange}
                onConfirm={handleCustomDateConfirm}
                buttonText={t("common.confirm")}
                placeholder={t("workshopDashboardScreen.searchDatePlaceholder")}
              />

              <SearchInput
                placeholder={t("workshopDashboardScreen.searchWorkshopOrPlate")}
                value={customWorkshopPlate}
                onChangeText={setCustomWorkshopPlate}
              />
            </View>
          )}
        </View>

        {/* LIST */}
        <View style={styles.listContainer}>
          <FlatList
            data={inspections}
            keyExtractor={(item) => String(item.id)}
            refreshing={loading}
            onRefresh={onRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.emptyText}>
                  {t("workshopInspectionsScreen.noInspections")}
                </Text>
              ) : null
            }
            ListFooterComponent={
              loadingMore ? <ActivityIndicator color={colors.primary} /> : null
            }
            renderItem={renderItem}
          />
        </View>
      </View>
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
});