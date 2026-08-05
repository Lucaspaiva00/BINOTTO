import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Calendar } from "react-native-calendars";

import { colors } from "@/theme/colors";

export type DateRangeValue = {
  start: string | null;
  end: string | null;
};

type Props = {
  value: DateRangeValue;
  buttonText?: string;
  onChange: (value: DateRangeValue) => void;
  onConfirm?: () => void;
  placeholder?: string;
  minimumDate?: string;
};

export function SearchDateRangeInput({
  value,
  buttonText = "Confirmar",
  onChange,
  onConfirm,
  placeholder = "Selecione um período",
  minimumDate,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowPicker(false);
      };
    }, [])
  );

  const handleClose = () => {
    setShowPicker(false);
    onConfirm?.();
  };

  const format = (date: string | null) =>
    date ? dayjs(date).format("DD/MM/YYYY") : "";

  const displayText = (() => {
    if (value.start && value.end) {
      return `${format(value.start)} - ${format(value.end)}`;
    }

    if (value.start) {
      return format(value.start);
    }

    return placeholder;
  })();

  const onDayPress = (day: any) => {
    const { start, end } = value;

    if (!start) {
      onChange({
        start: day.dateString,
        end: null,
      });
      return;
    }

    if (start && !end) {
      if (day.dateString === start) {
        onChange({
          start,
          end: null,
        });
        return;
      }

      if (day.dateString > start) {
        onChange({
          start,
          end: day.dateString,
        });
      } else {
        onChange({
          start: day.dateString,
          end: start,
        });
      }

      return;
    }

    onChange({
      start: day.dateString,
      end: null,
    });
  };

  const markedDates = {
    ...(value.start && {
      [value.start]: {
        startingDay: true,
        color: colors.primary,
        textColor: colors.background,
      },
    }),
    ...(value.end && {
      [value.end]: {
        endingDay: true,
        color: colors.primary,
        textColor: colors.background,
      },
    }),
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.inputContainer}
        activeOpacity={0.8}
        onPress={() => setShowPicker(true)}
      >
        <MaterialCommunityIcons
          name="calendar-month-outline"
          size={22}
          color={colors.placeholder}
        />

        <Text
          style={[
            styles.inputText,
            !value.start && styles.placeholder,
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableWithoutFeedback
          onPress={handleClose}
        >
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Calendar
                  onDayPress={onDayPress}
                  markingType="period"
                  markedDates={markedDates}
                  minDate={minimumDate}
                  theme={{
                    calendarBackground:
                      colors.backgroundSurface,
                    dayTextColor: colors.text,
                    monthTextColor: colors.text,
                    arrowColor: colors.primary,
                    textDisabledColor: colors.placeholder,
                    todayTextColor: colors.primary,
                  }}
                />

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => {
                    setShowPicker(false);
                    onConfirm?.();
                  }}
                >
                  <Text style={styles.confirmText}>
                    {buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  inputContainer: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  inputText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "400",
  },

  placeholder: {
    color: colors.placeholder,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    maxWidth: 420,

    borderRadius: 20,
    overflow: "hidden",

    backgroundColor: colors.backgroundSurface,
  },

  confirmButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",

    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  confirmText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
});