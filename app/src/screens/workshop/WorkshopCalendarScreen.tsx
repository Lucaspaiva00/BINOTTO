import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AppHeader from "@/components/common/AppHeader";
import { colors } from "@/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "@/utils/calendar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency } from "@/utils/currency";
import {
  formatDateKey,
  formatHour,
  formatLongDate,
  formatMonthYear,
  isSameDay,
  isSameMonth,
  isToday,
} from "@/utils/date";
import WorkshopManagementService from "@/services/WorkshopManagementService";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStatusLabelKey, statusDotStyles } from "@/utils/status";
import { Calendar, Car, Clock, Wrench } from "lucide-react-native";
import ListCard from "@/components/common/ListCard";
import { colorStatus } from "@/services/ColorStatusService";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function WorkshopCalendarScreen() {
  const navigation = useNavigation<any>();
  const { locale } = useLanguage();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [servicesCalendar, setServicesCalendar] = useState<
    Record<string, any[]>
  >({});
  const [selectedServices, setSelectedServices] = useState<any[]>([]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>("");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval(calendarStart, calendarEnd);

    const [showCanceledModal, setShowCanceledModal] = useState(false);

  const weekDays = [
    t("workshopCalendarScreen.weekdays.mon"),
    t("workshopCalendarScreen.weekdays.tue"),
    t("workshopCalendarScreen.weekdays.wed"),
    t("workshopCalendarScreen.weekdays.thu"),
    t("workshopCalendarScreen.weekdays.fri"),
    t("workshopCalendarScreen.weekdays.sat"),
    t("workshopCalendarScreen.weekdays.sun"),
  ];

  function getDots(day: Date) {
    const key = formatDateKey(day);
    const servicesOfDay = servicesCalendar[key] || [];
    return Array.from(new Set(servicesOfDay.map((s) => s.status)));
  }

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

  async function loadCalendar() {
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const response = await WorkshopManagementService.getAgendaCalendar(
        month,
        year,
      );
      setServicesCalendar(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function loadServicesByDate(pageNumber: number, date: Date) {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      }
      const formattedDate = formatDateKey(date);
      const response = await WorkshopManagementService.getWorkshopServices(
        pageNumber,
        formattedDate,
      );
      const pagination = response.data;
      const newData = pagination.data;

      setHasMore(!!pagination.next_page_url);

      if (pageNumber === 1) {
        setSelectedServices(newData);
      } else {
        setSelectedServices((prev) => [...prev, ...newData]);
      }
      setPage(pageNumber);
    } catch (error) {
      console.log(error);
    } finally {
      if (pageNumber === 1) {
        setLoading(false);
      }
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await loadServicesByDate(page + 1, selectedDate);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadCalendar();
      await loadServicesByDate(1, selectedDate);
    } finally {
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setSelectedDate(new Date());
      loadCalendar();
      setPage(1);
      setHasMore(true);
      loadServicesByDate(1, selectedDate);
    }, []),
  );

  useEffect(() => {
    loadCalendar();
  }, [currentMonth]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadServicesByDate(1, selectedDate);
  }, [selectedDate]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <AppHeader
        logo={require("@/assets/binotto-dog-logo-cropped.png")}
        title={t("workshopCalendarScreen.title")}
        onBack={() => navigation.navigate("Dashboard")}
      />

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <View style={styles.monthNavigation}>
        <TouchableOpacity
          onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={styles.monthButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {formatMonthYear(currentMonth, locale, true)}
        </Text>

        <TouchableOpacity
          onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={styles.monthButton}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {weekDays.map((dayName, index) => (
          <View key={index} style={styles.weekHeaderItem}>
            <Text style={styles.weekHeaderText}>{dayName}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarContainer}>
        {days.map((day) => {
          const selected = isSameDay(day, selectedDate);
          const inMonth = isSameMonth(day, currentMonth);
          const dots = getDots(day);

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => setSelectedDate(day)}
              style={[
                styles.dayButton,
                isToday(day) && styles.todayDay,
                selected && styles.selectedDay,
                !inMonth && styles.outsideMonthDay,
              ]}
            >
              <Text
                style={[styles.dayText, selected && styles.selectedDayText]}
              >
                {day.getDate()}
              </Text>

              <View style={styles.dotsContainer}>
                {dots.map((status, i) => {
                  const styleDot =
                    statusDotStyles[status as keyof typeof statusDotStyles] ??
                    statusDotStyles.default;

                  return (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        { backgroundColor: styleDot.dotColor },
                      ]}
                    />
                  );
                })}
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.selectedDateText}>
          {formatLongDate(selectedDate, locale)}
        </Text>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          style={{ flex: 1 }}
          data={selectedServices}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.flatListContent,
            selectedServices.length === 0 && { flex: 1 },
          ]}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} />
            ) : hasMore ? (
              <TouchableOpacity
                onPress={loadMore}
                activeOpacity={0.7}
                style={styles.loadMoreButton}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.loadMoreText}>
                  {t("workshopCalendarScreen.loadMore")}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t("workshopCalendarScreen.noServicesThisDay")}
                </Text>
              </View>
            )
          }
          renderItem={({ item: service }) => {

            const styleDot =
              statusDotStyles[service.status as keyof typeof statusDotStyles];
            const isFinalizado = service.status === "finalizado"||service.status === "concluido";
             const isAccept = service.status === "aceito";
            const baseColor = colorStatus(service.status, true);
 const inCanceled = service.status === "cancelado";
             const price = formatCurrency(
                          service.valor_total ?? 0,
                          service.moeda,
                          locale,
                        );
            return (
              <ListCard
                onPress={() => {
                if(isFinalizado){
 handleOpenServiceConfirm(service.id);
                } else if(inCanceled){
 setShowCanceledModal(true);
                } else{
                  service.status == "em_breve"
                    ? handleOpenServiceUpdate(Number(service.id))
                    : handleOpenDetails(Number(service.id))
                  }
                }
                
                }
                leftContent={<Wrench size={18} color={colors.primary} />}
                title={service.plate ?? ""}
                rightContent={
                                 <View style={{flexDirection:"row",alignItems:"center"}}>
                                   {inCanceled||isAccept?<></>:
                                   <Text style={{...styles.servicePrice,marginRight:7}}>
                                      {price.replace(/\s+/g, "")}
                                     </Text>
                               }
                                 <View
                                   style={[
                                     styles.statusBadge,
                                     {
                                     
                                       backgroundColor: `${colorStatus(service.status, false,true)}20`,
                                       borderColor: baseColor
                                         ? `${baseColor}60`
                                         : colors.primary,
                                       borderWidth: 1,
                                     },
                                   ]}
                                 >
                                   
                                   <Text
                                     style={{
                                       ...styles.statusBadgeText,
                                       color: colorStatus(service.status, false,true)
                                     }}
                                   >
                                     {t(getStatusLabelKey(service.status))}
                                   </Text>
                                 </View>
                                  </View>
                               }
                metaItems={
                  isFinalizado
                  ? []:
                  isAccept
                  ?
                  [
                  {
                    key: "arrival",
                    node: (
                      <>
                        <Clock size={16} color="#aaa" />

                        <Text style={styles.serviceInfoText}>
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
                        <Text style={styles.serviceInfoText}>
                          {service.quantidade ?? "--"}
                        </Text>
                      </>
                    ),
                  
                  },
                     ...(isAccept
                      ? [
                          {
                            key: "price",
                            node: (
                              <Text style={styles.servicePrice}>
                                {formatCurrency(
                                  service.valor_total,
                                  service.moeda,
                                  locale,
                                )}
                              </Text>
                            ),
                          },
                        ]
                      : []),
                ] :[] }
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
                        {t("workshopCalendarScreen.confirm")}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
              />
            );
          }}
        />
      </View>

       <ConfirmModal
        visible={showCanceledModal}
        title={t("workshopCalendarScreen.canceledTitle")}
        subtitle={t("workshopCalendarScreen.canceledMessage")}
        type="warning"
        variant="single"
        confirmText={t("common.back")}
        onConfirm={() => setShowCanceledModal(false)}
      />
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthNavigation: {
    marginTop: 24,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  monthButton: {
    width: 42,
    height: 42,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  weekHeader: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  weekHeaderItem: {
    width: `${100 / 7}%`,
    alignItems: "center",
  },
  weekHeaderText: {
    color: colors.textMuted,
    fontWeight: "500",
    fontSize: 12,
  },
  calendarContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    width: `${100 / 7}%`,
    padding: 8,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background,
  },
  selectedDay: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
  },
  todayDay: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  outsideMonthDay: {
    opacity: 0.3,
  },
  dayText: {
    color: colors.white,
  },
  selectedDayText: {
    color: colors.primary,
    fontWeight: "700",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38bdf8",
  },
  listContainer: {
    flex: 1,
    minHeight: 100,
    //  paddingHorizontal: 16,
  },
  flatListContent: {},
  selectedDateText: {
    color: colors.textMuted,
    marginVertical: 8,
    marginLeft: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  serviceInfoText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  servicePrice: {
    color: colors.textMuted,
    fontSize: 16,
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
  loadMoreButton: {
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadMoreText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
