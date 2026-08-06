import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors } from "@/theme/colors";

type Props = {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
  textStyle?: TextStyle;
};

export function DateInput({
  label,
  value,
  onChange,
  placeholder = "Selecione uma data",
  minimumDate,
  maximumDate,
  containerStyle,
  inputStyle,
  labelStyle,
  textStyle,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View style={[styles.section, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <TouchableOpacity
        style={[styles.input, inputStyle]}
        activeOpacity={0.8}
        onPress={() => setShowPicker((v) => !v)}
      >
        <View style={styles.inputContent}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={20}
            color={colors.textMuted}
          />

          <Text
            style={[
              styles.inputText,
              !value && styles.placeholder,
              textStyle,
            ]}
          >
            {value
              ? dayjs(value).format("DD/MM/YYYY")
              : placeholder}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={showPicker ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "calendar"}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            themeVariant="dark"
            onChange={(event, selectedDate) => {
              if (Platform.OS !== "ios") {
                setShowPicker(false);
              }

              if (selectedDate) {
                onChange(selectedDate);
              }
            }}
          />

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.confirmText}>Confirmar</Text>
            </TouchableOpacity>
          )}
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