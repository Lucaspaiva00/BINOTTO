import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { CameraPreset, CAMERA_PRESETS } from "./constants";
import { Box, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Disc, RotateCcw } from "lucide-react-native";

interface CarControlsProps {
  activePreset: CameraPreset | null;
  onSelectPreset: (preset: CameraPreset) => void;
  onReset: () => void;
}

const getPresetIcon = (presetId: CameraPreset, color: string) => {
  const size = 16;
  switch (presetId) {
    case "3D":
      return <Box size={size} color={color} />;
    case "FRONT":
      return <ArrowUp size={size} color={color} />;
    case "REAR":
      return <ArrowDown size={size} color={color} />;
    case "LEFT":
      return <ArrowLeft size={size} color={color} />;
    case "RIGHT":
      return <ArrowRight size={size} color={color} />;
    case "TOP":
      return <Disc size={size} color={color} />;
    default:
      return <Box size={size} color={color} />;
  }
};

const getPresetLabel = (presetId: CameraPreset) => {
  switch (presetId) {
    case "3D":
      return "3D";
    case "FRONT":
      return "Frente";
    case "LEFT":
      return "Esq.";
    case "RIGHT":
      return "Dir.";
    case "REAR":
      return "Traseira";
    case "TOP":
      return "Topo";
    default:
      return presetId;
  }
};

export const CarControls = memo(function CarControls({
  activePreset,
  onSelectPreset,
  onReset,
}: CarControlsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CAMERA_PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          const iconColor = isActive ? "#FFFFFF" : "#94A3B8";

          return (
            <Pressable
              key={preset.id}
              onPress={() => onSelectPreset(preset.id)}
              style={[styles.presetButton, isActive && styles.activePresetButton]}
            >
              {getPresetIcon(preset.id, iconColor)}
              <Text style={[styles.presetText, isActive && styles.activePresetText]}>
                {getPresetLabel(preset.id)}
              </Text>
            </Pressable>
          );
        })}

        <Pressable onPress={onReset} style={styles.resetButton}>
          <RotateCcw size={15} color="#94A3B8" />
        </Pressable>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    gap: 6,
  },
  presetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "transparent",
    gap: 4,
  },
  activePresetButton: {
    backgroundColor: "#2F8BFF",
  },
  presetText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  activePresetText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  resetButton: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginLeft: 2,
  },
});
