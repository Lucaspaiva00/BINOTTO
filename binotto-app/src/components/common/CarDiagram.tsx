import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { PartInspection } from "@/types/carParts";
import { CAR_PART_LAYOUTS, CAR_PARTS } from "@/utils/carParts";
import { REPAIR_COLORS } from "@/theme/repairColors";

type Props = {
  partsState: Record<string, PartInspection>;
  selectedPartId: string | null;
  setSelectedPartId: (id: string) => void;
  canEdit?: boolean;
  allowUndamagedParts?: boolean;
};

function getPartColor(item?: PartInspection): string {
  if (!item) return REPAIR_COLORS.SEM_DANO;

  switch (item.tipoReparo) {
    case "SEM_DANO":
      return REPAIR_COLORS.SEM_DANO;

    case "PDR":
      return REPAIR_COLORS.PDR;

    case "PINTURA":
      return REPAIR_COLORS.PINTURA;

    case "TROCA":
      return REPAIR_COLORS.TROCA;

    case "ALUMINIO_PDR":
      return REPAIR_COLORS.ALUMINIO_PDR;

    case "ALUMINIO_PINTURA":
      return REPAIR_COLORS.ALUMINIO_PINTURA;

    default:
      return REPAIR_COLORS.SEM_DANO;
  }
}

function getPartTextColor(item?: PartInspection): string {
  return !item || item.tipoReparo === "SEM_DANO" ? "#242A34" : "#FFFFFF";
}

export default function CarDiagram({
  partsState,
  selectedPartId,
  setSelectedPartId,
  canEdit = true,
  allowUndamagedParts = true,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      {CAR_PART_LAYOUTS.map((layout) => {
        const state = partsState[layout.id];
        const selected = selectedPartId === layout.id;
        const part = CAR_PARTS.find((p) => p.id === layout.id);
        const canOpenPart = allowUndamagedParts || (state && state.tipoReparo !== "SEM_DANO");

        if (!part) return null;

        return (
          <Pressable
            key={layout.id}
            onPress={() => {
              if (canEdit && canOpenPart) {
                setSelectedPartId(layout.id);
              }
            }}
            disabled={!canEdit || !canOpenPart}
            style={[
              styles.part,
              {
                borderTopLeftRadius: layout.radius?.tl ?? styles.part.borderRadius,
                borderTopRightRadius: layout.radius?.tr ?? styles.part.borderRadius,
                borderBottomLeftRadius: layout.radius?.bl ?? styles.part.borderRadius,
                borderBottomRightRadius: layout.radius?.br ?? styles.part.borderRadius,
                left: layout.x,
                top: layout.y,
                width: layout.w,
                height: layout.h,
                backgroundColor: getPartColor(state),
                 },
              selected && styles.selected,
              {  borderColor:getPartColor(state) == REPAIR_COLORS.ALUMINIO_PDR||getPartColor(state) == REPAIR_COLORS.ALUMINIO_PINTURA?"green":   "#BBC3CF",}
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: getPartTextColor(state) },
              ]}
            >
              {t(part.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    position: "relative",
  },
  part: {
    position: "absolute",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBC3CF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  selected: {
    borderColor: "#2F8BFF",
    borderWidth: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});