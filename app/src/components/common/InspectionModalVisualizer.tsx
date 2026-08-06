import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";

import { colors } from "@/theme/colors";
import { REPAIR_COLORS } from "@/theme/repairColors";
import { Input } from "@/components/common/Input";
import { PartInspection, RepairType } from "@/types/carParts";
import ImageViewerModal from "./ImageViewerModal";
import { useTranslation } from "react-i18next";

type Props = {
  visible: boolean;
  partName: string;
  value: PartInspection;
  inspectionComplete?: boolean;
  onClose: () => void;
};

export default function InspectionModalVisualizer({
  visible,
  partName,
  value,
  inspectionComplete = false,
  onClose,
}: Props) {
  const { t } = useTranslation();

  const REPAIR_OPTIONS: {
    value: RepairType;
    label: string;
    color: string;
  }[] = [
    {
      value: "SEM_DANO",
      label: t("repairTypes.SEM_DANO"),
      color: REPAIR_COLORS.SEM_DANO,
    },
    {
      value: "PDR",
      label: t("repairTypes.PDR"),
      color: REPAIR_COLORS.PDR,
    },
    {
      value: "PINTURA",
      label: t("repairTypes.PINTURA"),
      color: REPAIR_COLORS.PINTURA,
    },
    {
      value: "TROCA",
      label: t("repairTypes.TROCA"),
      color: REPAIR_COLORS.TROCA,
    },
    {
      value: "ALUMINIO_PDR",
      label: t("repairTypes.ALUMINIO_PDR"),
      color: REPAIR_COLORS.ALUMINIO_PDR,
    },
    {
      value: "ALUMINIO_PINTURA",
      label: t("repairTypes.ALUMINIO_PINTURA"),
      color: REPAIR_COLORS.ALUMINIO_PINTURA,
    },
  ];

  const [local, setLocal] = useState<PartInspection>(value);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleOpenImage = (uri: string) => {
    setSelectedImage(uri);
    setViewerVisible(true);
  };

  const selectedRepair = REPAIR_OPTIONS.find(
    (option) => option.value === local.tipoReparo,
  );

  const hasDentInfo =
    (local.quantidadeAmassados ?? 0) > 0 ||
    (local.quantidadeImpactosMaior25 ?? 0) > 0 ||
    (local.quantidadeImpactosMenor25 ?? 0) > 0 ||
    (local.coeficiente ?? 0) > 0 ||
    !!local.tamanhoAmassado;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{t("inspectionModal.title")}</Text>
                <Text style={styles.subtitle}>{partName}</Text>
              </View>
              <Pressable onPress={onClose}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                {t("inspectionModal.repairType")}
              </Text>

              <View style={styles.repairGrid}>
                {selectedRepair && (
                  <View
                    style={[
                      styles.repairChip,
                      {
                        borderColor: selectedRepair.color,
                        backgroundColor: `${selectedRepair.color}20`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: selectedRepair.color },
                      ]}
                    />
                    <Text style={styles.repairChipText}>
                      {selectedRepair.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {inspectionComplete && hasDentInfo && (
              <View style={styles.dentsContainer}>
                <View style={styles.dentsRow}>
                  { local.quantidadeImpactosMaior25 > 0 && (
                    <View style={styles.dentField}>
                      <Text style={styles.label}>
                        {t("inspectionModal.quantityImpactsGreater25")}
                      </Text>
                      <Input
                        keyboardType="numeric"
                        value={String(local.quantidadeImpactosMaior25)}
                        onChangeText={(value) =>
                          setLocal((prev) => ({
                            ...prev,
                            quantidadeImpactosMaior25: Number(value) || 0,
                          }))
                        }
                        style={[
                          styles.inputStyle,
                          { minHeight: 44, fontSize: 14 },
                        ]}
                        editable={false}
                      />
                    </View>
                  )}

                  { local.quantidadeImpactosMenor25 > 0 && (
                    <View style={styles.dentField}>
                      <Text style={styles.label}>
                        {t("inspectionModal.quantityImpactsLess25")}
                      </Text>
                      <Input
                        keyboardType="numeric"
                        value={String(local.quantidadeImpactosMenor25)}
                        onChangeText={(value) =>
                          setLocal((prev) => ({
                            ...prev,
                            quantidadeImpactosMenor25: Number(value) || 0,
                          }))
                        }
                        style={[
                          styles.inputStyle,
                          { minHeight: 44, fontSize: 14 },
                        ]}
                        editable={false}
                      />
                    </View>
                  )}
                </View>

                {/* <View style={styles.dentsRow}>
                  {local.quantidadeAmassados > 0 && (
                    <View style={styles.dentField}>
                      <Text style={styles.label}>
                        {t("inspectionModal.quantityDents")}
                      </Text>
                      <Input
                        keyboardType="numeric"
                        value={String(local.quantidadeAmassados ?? 0)}
                        style={[
                          styles.inputStyle,
                          { minHeight: 44, fontSize: 14 },
                        ]}
                        editable={false}
                      />
                    </View>
                  )}

                  {local.tamanhoAmassado && (
                    <View style={styles.dentField}>
                      <Text style={styles.label}>
                        {t("inspectionModal.sizeDents")}
                      </Text>
                      <View style={styles.sizeSelector}>
                        {(["P", "M", "G"] as const).map((size) => {
                          const selected = local.tamanhoAmassado === size;
                          return (
                            <View
                              key={size}
                              style={[
                                styles.sizeButton,
                                selected && styles.sizeButtonSelected,
                                { opacity: selected ? 1 : 0.4 },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.sizeButtonText,
                                  selected && styles.sizeButtonTextSelected,
                                ]}
                              >
                                {size}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                </View> */}

                {/* {local.coeficiente > 0 && (
                  <View style={styles.dentField}>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.label}>
                        {t("inspectionModal.coefficient")}
                      </Text>
                      <Text style={[styles.label, { fontSize: 10 }]}>
                        ({t("inspectionModal.coefficientDescription")})
                      </Text>
                    </View>
                    <Input
                      keyboardType="numeric"
                      value={String(local.coeficiente ?? 0)}
                      style={[styles.inputStyle, { minHeight: 44, fontSize: 14 }]}
                      editable={false}
                    />
                  </View>
                )} */}
              </View>
            )}

            {!!local.observacoes?.trim() && (
              <Input
                label={t("inspectionModal.notes")}
                multiline
                value={local.observacoes ?? ""}
                style={styles.inputStyle}
                editable={false}
              />
            )}

            {!!local.fotos?.length && (
              <View>
                <Text style={styles.sectionTitle}>
                  {t("inspectionModal.photos")} ({local.fotos?.length ?? 0}/2)
                </Text>

                <View style={styles.grid}>
                  {Array.from({ length: Math.max(local.fotos?.length ?? 0, 2) })
                    .slice(0, 2)
                    .map((_, index) => {
                      const photo = local.fotos?.[index];
                      if (!photo) {
                        return (
                          <View key={index} style={styles.photoBox}>
                            <Text style={styles.emptySlot}>-</Text>
                          </View>
                        );
                      }
                      const uri =
                        photo.type === "existing" ? photo.uri : photo.asset.uri;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.photoBox}
                          onPress={() => handleOpenImage(uri)}
                        >
                          <Image source={{ uri }} style={styles.photo} />
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>
                  {t("common.close")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <ImageViewerModal
        visible={viewerVisible}
        image={selectedImage}
        onClose={() => {
          setViewerVisible(false);
          setSelectedImage(null);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 4,
  },
  close: {
    color: colors.textMuted,
    fontSize: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 12,
  },
  repairGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  repairChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSurface,
  },
  repairChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  dentsContainer: {
    gap: 8,
  },
  dentsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dentField: {
    flex: 1,
  },
  label: {
    fontWeight: "500",
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  sizeSelector: {
    flexDirection: "row",
    gap: 4,
  },
  sizeButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundBase,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeButtonSelected: {
    borderColor: colors.white,
  },
  sizeButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  sizeButtonTextSelected: {},
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoBox: {
    width: "31%",
    height: "31%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  emptySlot: {
    color: colors.textMuted,
    fontSize: 24,
    fontWeight: "300",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  inputStyle: {
    backgroundColor: colors.backgroundBase,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
});
