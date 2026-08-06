import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { PartInspection } from "@/types/carParts";
import { CAR_3D_PARTS } from "./constants";
import { project3DPoint } from "./useCarRotation";
import { REPAIR_COLORS } from "@/theme/repairColors";

interface CarLabelsProps {
  width: number;
  height: number;
  yaw: number;
  pitch: number;
  zoom: number;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  partsState: Record<string, PartInspection>;
}

function getPartColor(item?: PartInspection): string {
  if (!item) return REPAIR_COLORS.SEM_DANO;
  switch (item.tipoReparo) {
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

export function CarLabels({
  width,
  height,
  yaw,
  pitch,
  zoom,
  selectedPartId,
  hoveredPartId,
  partsState,
}: CarLabelsProps) {
  const { t } = useTranslation();

  // Determinar qual peça deve exibir a etiqueta flutuante (selecionada ou com hover)
  const activePartId = selectedPartId || hoveredPartId;

  const activeLabelData = useMemo(() => {
    if (!activePartId) return null;

    const meshDef = CAR_3D_PARTS.find((p) => p.id === activePartId && p.isSelectable);
    if (!meshDef || !meshDef.labelKey) return null;

    // Calcular projeção 3D da etiqueta ancorada no centro geométrico da peça
    const anchor = project3DPoint(meshDef.center, width, height, yaw, pitch, zoom);

    // Se a peça estiver atrás da câmera (zDepth muito próximo/atrás), ocultar etiqueta
    if (anchor.zDepth > 1.8) return null;

    const state = partsState[activePartId];
    const color = getPartColor(state);

    return {
      id: activePartId,
      labelKey: meshDef.labelKey,
      x: anchor.x,
      y: anchor.y,
      state,
      color,
      isSelected: selectedPartId === activePartId,
    };
  }, [activePartId, width, height, yaw, pitch, zoom, selectedPartId, partsState]);

  if (!activeLabelData) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Ponto Pin Indicador Ancorado no Centro 3D da Peça */}
      <View
        style={[
          styles.pinDot,
          {
            left: activeLabelData.x - 6,
            top: activeLabelData.y - 6,
            borderColor: activeLabelData.isSelected ? "#2F8BFF" : "#FFFFFF",
          },
        ]}
      />

      {/* Cartão de Etiqueta Flutuante (Callout Badge) */}
      <View
        style={[
          styles.calloutCard,
          {
            left: Math.max(16, Math.min(width - 160, activeLabelData.x - 70)),
            top: Math.max(16, activeLabelData.y - 48),
            borderColor: activeLabelData.isSelected ? "#2F8BFF" : "#475569",
          },
        ]}
      >
        <View style={[styles.colorIndicator, { backgroundColor: activeLabelData.color }]} />
        <Text style={styles.labelText}>{t(activeLabelData.labelKey)}</Text>
        {activeLabelData.state && activeLabelData.state.tipoReparo !== "SEM_DANO" && (
          <View style={styles.repairBadge}>
            <Text style={styles.repairText}>{activeLabelData.state.tipoReparo}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pinDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2F8BFF",
    borderWidth: 2,
    shadowColor: "#2F8BFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  calloutCard: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 6,
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "700",
  },
  repairBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  repairText: {
    color: "#60A5FA",
    fontSize: 9,
    fontWeight: "800",
  },
});
