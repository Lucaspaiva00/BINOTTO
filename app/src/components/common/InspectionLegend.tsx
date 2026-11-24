import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme/colors";

const entries = [
  ["inspectionSummary.glue", "#f8fafc", "#111827"],
  ["repairTypes.PDR", "#1f8bff"],
  ["repairTypes.PINTURA", "#facc15"],
  ["repairTypes.ALUMINIO_PDR", "#1f8bff", "#22c55e"],
  ["repairTypes.ALUMINIO_PINTURA", "#facc15", "#22c55e"],
  ["repairTypes.TROCA", "#e34c4c"],
  ["repairTypes.SEM_DANO", "#d1d5db"],
] as const;

export function InspectionLegend() {
  const { t } = useTranslation();
  const prefix = useId().replace(/[^\w-]/g, "");
  return <View style={styles.legend}>
    {entries.map(([label, fill, stripe], index) => {
      const id = `${prefix}${index}`;
      return <View key={label} style={styles.item}>
        <Svg width={12} height={12} viewBox="0 0 12 12">
          {stripe && <Defs><Pattern id={id} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width={5} height={5} fill={fill} />
            <Rect width={2} height={5} fill={stripe} />
          </Pattern></Defs>}
          <Circle cx={6} cy={6} r={6} fill={stripe ? `url(#${id})` : fill} />
        </Svg>
        <Text style={styles.label}>{t(label)}</Text>
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", paddingVertical: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 5 },
  label: { color: colors.text, fontSize: 11 },
});
