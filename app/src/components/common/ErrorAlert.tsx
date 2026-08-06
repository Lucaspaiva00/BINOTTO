import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type Props = {
  message: string;
  onClose: () => void;
};

export function ErrorAlert({ message, onClose }: Props) {
  return (
    <View style={styles.errorAlert}>
      <View style={styles.errorIcon}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={20}
          color="#fca5a5"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.errorMessage}>{message}</Text>
      </View>

      <TouchableOpacity onPress={onClose} hitSlop={10}>
        <MaterialCommunityIcons
          name="close"
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errorAlert: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#2a1111",
    borderWidth: 1,
    borderColor: "#7f1d1d",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  errorIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  errorMessage: {
    color: "#fca5a5",
    fontSize: 13,
    lineHeight: 18,
  },
});