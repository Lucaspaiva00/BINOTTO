import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "@/theme/colors";
import { REPAIR_COLORS } from "@/theme/repairColors";
import type { PartInspection } from "@/types/carParts";
import { CAR_PARTS } from "@/utils/carParts";

type Props = {
  parts: Record<string, PartInspection>;
  onSelectPart?: (id: string) => void;
};

export default function InspectionSummary({ parts, onSelectPart }: Props) {
  const { t } = useTranslation();
  const rows = CAR_PARTS.filter(({ id }) => parts[id] && (parts[id].tipoReparo !== "SEM_DANO" || parts[id].especificacoes));
  if (!rows.length) return null;

  return <View style={styles.panel}>
    <Text style={styles.title}>{t("technicianNewServiceScreen.changeSummary")}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
      <View>
        <View style={[styles.row, styles.header]}>
          <Text style={styles.piece}>{t("inspectionSummary.piece")}</Text>
          <Text style={styles.repair}>{t("inspectionModal.repairType")}</Text>
          <Text style={styles.metric}>{t("inspectionSummary.smallImpacts")}</Text>
          <Text style={styles.metric}>25–50 mm</Text>
          <Text style={styles.metric}>&gt;50 mm</Text>
          <Text style={styles.metric}>{t("inspectionSummary.glue")}</Text>
          <Text style={styles.metric}>{t("inspectionSummary.aluminum")}</Text>
          <Text style={styles.metric}>{t("inspectionSummary.total")}</Text>
          <Text style={styles.metric}>{t("inspectionModal.photos")}</Text>
        </View>
        {rows.map(({ id, labelKey }) => {
          const part = parts[id];
          const label = t(labelKey);
          return <View key={id} style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityLabel={label}
              disabled={!onSelectPart} style={styles.piece} onPress={() => onSelectPart?.(id)}>
              <Text style={styles.pieceText}>{label}</Text>
            </Pressable>
            <View style={[styles.repair, styles.repairCell]}>
              <View style={[styles.dot, { backgroundColor: REPAIR_COLORS[part.tipoReparo] }]} />
              <Text style={styles.text}>{t(`repairTypes.${part.tipoReparo}`)}</Text>
            </View>
            <Text style={styles.metric}>{part.especificacoes?.amassadosMenor25 ?? part.quantidadeImpactosMenor25 ?? "—"}</Text>
            <Text style={styles.metric}>{part.especificacoes?.amassados25a50 ?? "—"}</Text>
            <Text style={styles.metric}>{part.especificacoes?.amassadosMaior50 ?? "—"}</Text>
            <Text style={styles.metric}>{part.especificacoes?.cola ? "✓" : "—"}</Text>
            <Text style={styles.metric}>{(part.especificacoes?.aluminio ?? part.tipoReparo.startsWith("ALUMINIO_")) ? "✓" : "—"}</Text>
            <Text style={styles.metric}>{part.tipoReparo === "TROCA" ? t("inspectionSummary.newPart") : part.especificacoes?.total ?? "—"}</Text>
            <Text style={styles.metric}>{part.fotos?.length ?? 0}</Text>
          </View>;
        })}
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  panel: { paddingVertical: 12, borderTopWidth: 1, borderColor: colors.border },
  title: { color: colors.white, fontWeight: "700", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 44, borderBottomWidth: 1, borderColor: colors.border },
  header: { backgroundColor: colors.background },
  piece: { width: 150, paddingHorizontal: 8, color: colors.white },
  pieceText: { color: colors.white, fontWeight: "600" },
  repair: { width: 150, paddingHorizontal: 8, color: colors.white },
  repairCell: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metric: { width: 85, textAlign: "center", color: colors.white, fontSize: 12 },
  text: { color: colors.white, fontSize: 12 },
});
