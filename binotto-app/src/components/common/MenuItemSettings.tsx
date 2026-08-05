import { colors } from "@/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MenuItem({
  icon,
  label,
  onPress,
  danger = false,
}: any) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, danger && styles.menuItemDanger]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={danger ? colors.danger : colors.textMuted}
        />
        <Text style={[styles.menuText, danger && styles.menuItemDangerLabel]}>
          {label}
        </Text>
      </View>

      {!danger && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={colors.textMuted}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderMutedCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 62,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuItemDanger: {
    backgroundColor: "#241416",
    borderWidth: 1,
    borderColor: "#4A161C",
  },

  menuItemDangerLabel: {
    color: colors.danger,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  menuText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
