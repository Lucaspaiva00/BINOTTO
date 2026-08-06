import { colors } from "@/theme/colors";
import { StyleSheet, Text, View } from "react-native";

type LegendDotProps = {
  color: string;
  label: string;
};

export default function LegendDot({ color, label }: LegendDotProps): JSX.Element {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },

    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 6,
        marginRight: 6,
    },

    legendText: {
        color: colors.textMuted,
        fontSize: 11,
    }
})

