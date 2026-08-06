import React, { memo, useState, useCallback } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { PartInspection } from "@/types/carParts";
import { useCarRotation } from "./useCarRotation";
import { useCarSelection } from "./useCarSelection";
import { CarMesh } from "./CarMesh";
import { CarLabels } from "./CarLabels";
import { CarControls } from "./CarControls";

export interface Car3DProps {
  partsState: Record<string, PartInspection>;
  selectedPartId: string | null;
  setSelectedPartId: (id: string) => void;
  canEdit?: boolean;
  allowUndamagedParts?: boolean;
}

export const Car3D = memo(function Car3D({
  partsState,
  selectedPartId,
  setSelectedPartId,
  canEdit = true,
  allowUndamagedParts = true,
}: Car3DProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 340,
    height: 390,
  });

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  }, []);

  const {
    rotation,
    rotateToPreset,
    resetRotation,
    panResponder,
  } = useCarRotation("3D");

  const {
    hoveredPartId,
    handleSelectPart,
    handleHoverPart,
    isPartSelectable,
  } = useCarSelection({
    partsState,
    selectedPartId,
    setSelectedPartId,
    canEdit,
    allowUndamagedParts,
  });

  return (
    <View style={styles.outerContainer} onLayout={handleLayout}>
      {/* Estúdio / Stage de Visualização 3D */}
      <View style={styles.stage} {...panResponder.panHandlers}>
        {/* Dica de interação 360° com Ângulo em Tempo Real */}
        <View style={styles.headerInfoContainer} pointerEvents="none">
          <View style={styles.orbitBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.orbitText}>360° Interativo</Text>
          </View>

          <View style={styles.angleBadge}>
            <Text style={styles.angleText}>{Math.round(rotation.yaw)}°</Text>
          </View>
        </View>

        {/* Cenas Poligonais 3D do Veículo */}
        <CarMesh
          width={dimensions.width}
          height={dimensions.height}
          yaw={rotation.yaw}
          pitch={rotation.pitch}
          zoom={rotation.zoom}
          partsState={partsState}
          selectedPartId={selectedPartId}
          hoveredPartId={hoveredPartId}
          isPartSelectable={isPartSelectable}
          onSelectPart={handleSelectPart}
          onHoverPart={handleHoverPart}
        />

        {/* Callouts e Etiquetas de Peças Ancoradas */}
        <CarLabels
          width={dimensions.width}
          height={dimensions.height}
          yaw={rotation.yaw}
          pitch={rotation.pitch}
          zoom={rotation.zoom}
          selectedPartId={selectedPartId}
          hoveredPartId={hoveredPartId}
          partsState={partsState}
        />

        {/* Barra de Controles de Câmera e Ângulos Predefinidos */}
        <CarControls
          activePreset={rotation.activePreset}
          onSelectPreset={rotateToPreset}
          onReset={resetRotation}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    height: 390,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  stage: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090D16",
  },
  headerInfoContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  orbitBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  orbitText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "700",
  },
  angleBadge: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  angleText: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
  },
});
