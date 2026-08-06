import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type Props = {
  message: string;
  onClose: () => void;
};

export function SuccessAlert({ message, onClose }: Props) {
  return (
    <View style={styles.successAlert}>
      <View style={styles.successIcon}>
        <MaterialCommunityIcons
          name="check-circle"
          size={20}
          color="#86efac"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.successMessage}>{message}</Text>
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
  successAlert: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#0f2a18",
    borderWidth: 1,
    borderColor: "#14532d",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  successIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  successMessage: {
    color: "#86efac",
    fontSize: 13,
    lineHeight: 18,
  },
});