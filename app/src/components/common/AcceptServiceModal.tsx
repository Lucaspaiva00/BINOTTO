import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";
import { formatArrivalTime } from "@/utils/date";
import { Clock } from "lucide-react-native";

interface AcceptServiceModalProps {
  visible: boolean;
  onClose: () => void;
  dataInicio: string | null;
  dataFim: string | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  arrivalTime: Date;
  setArrivalTime: (date: Date) => void;
  showTimePicker: boolean;
  setShowTimePicker: (show: boolean) => void;
  accepting: boolean;
  acceptSuccess: boolean;
  acceptError: string | null;
  onAccept: () => void;
  t: any;
}

const QUICK_TIMES = [
  { hour: 7, minute: 30, label: "07:30" },
  { hour: 10, minute: 0, label: "10:00" },
  { hour: 13, minute: 30, label: "13:30" },
  { hour: 15, minute: 0, label: "15:00" },
];

export default function AcceptServiceModal({
  visible,
  onClose,
  dataInicio,
  dataFim,
  selectedDate,
  setSelectedDate,
  arrivalTime,
  setArrivalTime,
  showTimePicker,
  setShowTimePicker,
  accepting,
  acceptSuccess,
  acceptError,
  onAccept,
  t,
}: AcceptServiceModalProps) {

  const availableDates = React.useMemo(() => {
    if (!dataInicio) return [];

    if (!dataFim) {
      return [new Date(dataInicio)];
    }

    const dates: Date[] = [];

    const start = new Date(dataInicio);
    const end = new Date(dataFim);

    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [dataInicio, dataFim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          {acceptSuccess ? (
            <>
              <MaterialCommunityIcons
                name="check-circle"
                size={64}
                color="#22c55e"
                style={{ alignSelf: "center" }}
              />

              <Text
                style={[
                  styles.modalTitle,
                  { textAlign: "center", marginTop: 16 },
                ]}
              >
                {t("technicianDashboardScreen.serviceAccepted")}
              </Text>

              <Text style={[styles.modalText, { textAlign: "center" }]}>
                {t("technicianDashboardScreen.serviceAcceptedDescription")}
              </Text>

              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.modalButtonText}>
                  {t("technicianDashboardScreen.close")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>
                {t("technicianDashboardScreen.acceptService")}
              </Text>

              <Text style={styles.modalText}>
                {availableDates.length === 1
                  ? t("technicianDashboardScreen.serviceAvailableDescription")
                  : t(
                      "technicianDashboardScreen.acceptServiceDescriptionModal",
                    )}
              </Text>

              {acceptError && (
                <View style={styles.modalErrorContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={18}
                    color="#ef4444"
                  />

                  <Text style={styles.modalErrorText}>{acceptError}</Text>
                </View>
              )}

              {availableDates.length === 1 ? (
                <View style={styles.singleDateContainer}>
                  <Text style={styles.singleDateText}>
                    {availableDates[0].toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={{ ...styles.label, marginTop: 16 }}>
                    {t("technicianDashboardScreen.labelDateAccept")}
                  </Text>

                  <View style={styles.datesContainer}>
                    {availableDates.map((date) => {
                      const isSelected =
                        selectedDate.toDateString() === date.toDateString();

                      return (
                        <TouchableOpacity
                          key={date.toISOString()}
                          onPress={() => setSelectedDate(date)}
                          style={[
                            styles.dateButton,
                            isSelected
                              ? styles.dateButtonSelected
                              : styles.dateButtonUnselected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dateButtonText,
                              isSelected
                                ? styles.dateButtonTextSelected
                                : styles.dateButtonTextUnselected,
                            ]}
                          >
                            {date.toLocaleDateString("pt-BR")}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={styles.label}>
                {t("technicianDashboardScreen.arrivalTime")}
              </Text>

              <View style={styles.quickTimesContainer}>
                {QUICK_TIMES.map((time) => {
                  const selected =
                    arrivalTime.getHours() === time.hour &&
                    arrivalTime.getMinutes() === time.minute;

                  return (
                    <TouchableOpacity
                      key={time.label}
                      disabled={accepting}
                      onPress={() => {
                        const date = new Date(arrivalTime);
                        date.setHours(time.hour);
                        date.setMinutes(time.minute);
                        date.setSeconds(0);
                        date.setMilliseconds(0);

                        setArrivalTime(date);
                      }}
                      style={[
                        styles.quickTimeBadge,
                        selected && styles.quickTimeBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickTimeText,
                          selected && styles.quickTimeTextSelected,
                        ]}
                      >
                        {time.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.timeInput, accepting && { opacity: 0.6 }]}
                disabled={accepting}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={colors.primary} />

                <Text style={styles.timeInputText}>
                  {formatArrivalTime(arrivalTime)}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={arrivalTime}
                  mode="time"
                  is24Hour
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(false);

                    if (selectedDate) {
                      setArrivalTime(selectedDate);
                    }
                  }}
                />
              )}

              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.borderMuted,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: accepting ? 0.5 : 1,
                  }}
                  disabled={accepting}
                  onPress={onClose}
                >
                  <Text style={{ color: colors.white }}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      flex: 1,
                      marginTop: 0,
                      opacity: accepting ? 0.7 : 1,
                    },
                  ]}
                  disabled={accepting}
                  onPress={onAccept}
                >
                  {accepting ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <ActivityIndicator color={colors.black} />

                      <Text style={styles.modalButtonText}>
                        {t("technicianDashboardScreen.accepting")}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.modalButtonText}>
                      {t("technicianDashboardScreen.accept")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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

  timeInput: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 0,
  },

  timeInputText: {
    color: colors.white,
    fontSize: 16,
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

  modalErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
  },

  modalErrorText: {
    flex: 1,
    color: "#ef4444",
    fontSize: 14,
  },

  label: {
    color: colors.white,
    marginBottom: 8,
    fontWeight: "600",
  },

  dateButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },

  dateButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  dateButtonUnselected: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },

  dateButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },

  dateButtonTextSelected: {
    color: colors.black,
  },

  dateButtonTextUnselected: {
    color: colors.textMuted,
  },

  datesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  singleDateContainer: {
    alignItems: "center",
    marginVertical: 22,
  },

  singleDateText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
  },

  quickTimesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  quickTimeBadge: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  quickTimeBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  quickTimeText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  quickTimeTextSelected: {
    color: colors.black,
  },
});
