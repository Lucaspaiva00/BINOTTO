import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Calendar } from "react-native-calendars";
import { colors } from "@/theme/colors";

type DateRangeValue = {
  start: string | null;
  end: string | null;
};

type Props = {
  label?: string;
  value: DateRangeValue;
  buttonText: string;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  minimumDate?: string;
};

export function DateRangeInput({
  label,
  value,
  buttonText = "Confirmar",
  onChange,
  placeholder = "Selecione uma data ou intervalo",
  minimumDate,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowPicker(false);
      };
    }, []),
  );

  const format = (date: string | null) =>
    date ? dayjs(date).format("DD/MM/YYYY") : "";

  const displayText = (() => {
    if (value.start && value.end) {
      return `${format(value.start)} → ${format(value.end)}`;
    }

    if (value.start) {
      return format(value.start);
    }

    return placeholder;
  })();

  const onDayPress = (day: any) => {
    const { start, end } = value;

    // nenhuma data selecionada
    if (!start) {
      onChange({
        start: day.dateString,
        end: null,
      });
      return;
    }

    // já existe início e não existe fim
    if (start && !end) {
      // clicou na mesma data => mantém somente uma data
      if (day.dateString === start) {
        onChange({
          start,
          end: null,
        });
        return;
      }

      // cria intervalo
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

    // já existe range completo -> começa novo
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
    <View style={styles.section}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* INPUT */}
      <TouchableOpacity
        style={styles.input}
        activeOpacity={0.8}
        onPress={() => setShowPicker((v) => !v)}
      >
        <View style={styles.inputContent}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={20}
            color={colors.textMuted}
          />

          <Text style={[styles.inputText, !value.start && styles.placeholder]}>
            {displayText}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={showPicker ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {/* PICKER */}
      {showPicker && (
        <View style={styles.pickerWrapper}>
          <Calendar
            onDayPress={onDayPress}
            markingType="period"
            markedDates={markedDates}
            minDate={minimumDate}
            theme={{
              calendarBackground: colors.backgroundSurface,
              dayTextColor: colors.text,
              monthTextColor: colors.text,
              arrowColor: colors.primary,
              textDisabledColor: colors.placeholder,
              todayTextColor: colors.primary,
            }}
          />

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => setShowPicker(false)}
          >
            <Text style={styles.confirmText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },

  label: {
    fontWeight: "500",
    color: colors.textMuted,
  },

  input: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  inputText: {
    color: colors.text,
    fontWeight: "400",
  },

  placeholder: {
    color: colors.placeholder,
  },

  pickerWrapper: {
    marginTop: 10,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
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
});
