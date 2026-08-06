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

import * as ImagePicker from "expo-image-picker";

import { colors } from "@/theme/colors";
import { REPAIR_COLORS } from "@/theme/repairColors";

import { Input } from "@/components/common/Input";

import { PartInspection, Photo, RepairType } from "@/types/carParts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ImageViewerModal from "./ImageViewerModal";
import { useTranslation } from "react-i18next";
import PermissionController from "@/controllers/permission.controller";
import { useNavigation } from "@react-navigation/native";
import { optimizeImage } from "@/utils/images";

type Props = {
  visible: boolean;
  partName: string;
  value: PartInspection;
  inspectionComplete?: boolean;
  onClose: () => void;
  onSave: (data: PartInspection) => void;
  removeReparoPhoto?: (photo: Photo) => void;
};

export default function InspectionModal({
  visible,
  partName,
  value,
  inspectionComplete = false,
  onClose,
  onSave,
  removeReparoPhoto,
}: Props) {
  const { t } = useTranslation();
    const navigation = useNavigation<any>();

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

  // states
  const [local, setLocal] = useState<PartInspection>(value);
  const [removedPhotos, setRemovedPhotos] = useState<Photo[]>([]);

  // fotos
  const photos = local.fotos ?? [];

  // utils
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setRemovedPhotos([]);
    setLocal(value);
  }, [value]);

  // functions
  const handleOpenImage = (uri: string) => {
    setSelectedImage(uri);
    setViewerVisible(true);
  };

  const selectRepairType = (tipo: RepairType) => {
    setLocal((prev) => ({
      ...prev,
      tipoReparo: tipo,
    }));
  };


  const takePhoto = async () => {
     PermissionController.checkCameraPermission(navigation,async ()=>{
    if ((local.fotos?.length ?? 0) >= 2) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (result.canceled) return;

    const optimizedAsset = await optimizeImage(result.assets[0]);

    setLocal((prev) => ({
      ...prev,
      fotos: [
        ...(prev.fotos ?? []),
        {
          type: "new",
          asset: optimizedAsset,
        },
      ],
    }));
  });
  };

  const removePhoto = (index: number) => {
    const photo = local.fotos?.[index];

    if (!photo) return;

    setRemovedPhotos((prev) => [...prev, photo]);

    setLocal((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    removedPhotos.forEach((photo) => {
      removeReparoPhoto?.(photo);
    });

    onSave(local);
    onClose();
  };

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
                {t("inspectionModal.repairType").toUpperCase()}
              </Text>

              <View style={styles.repairGrid}>
                {REPAIR_OPTIONS.map((option) => {
                  const selected = local.tipoReparo === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => selectRepairType(option.value)}
                      style={[
                        styles.repairChip,
                        selected && {
                          borderColor: option.color,
                          backgroundColor: `${option.color}20`,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor: option.color,
                          },
                        ]}
                      />

                      <Text style={styles.repairChipText}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {inspectionComplete && (
              <View style={styles.dentsContainer}>
                <View style={styles.dentsRow}>
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
                    />
                  </View>

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
                    />
                  </View>
                </View>

                {/* <View style={styles.dentsRow}>
                  <View style={styles.dentField}>
                    <Text style={styles.label}>
                      {t("inspectionModal.quantityDents")}
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={String(local.quantidadeAmassados)}
                      onChangeText={(value) =>
                        setLocal((prev) => ({
                          ...prev,
                          quantidadeAmassados: Number(value) || 0,
                        }))
                      }
                      style={[
                        styles.inputStyle,
                        { minHeight: 44, fontSize: 14 },
                      ]}
                    />
                  </View>

                  <View style={styles.dentField}>
                    <View>
                      <Text style={styles.label}>
                        {t("inspectionModal.sizeDents")}
                      </Text>

                      <View style={styles.sizeSelector}>
                        {(["P", "M", "G"] as const).map((size) => {
                          const selected = local.tamanhoAmassado === size;

                          return (
                            <Pressable
                              key={size}
                              onPress={() =>
                                setLocal((prev) => ({
                                  ...prev,
                                  tamanhoAmassado: size,
                                }))
                              }
                              style={[
                                styles.sizeButton,
                                selected && styles.sizeButtonSelected,
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
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </View> */}

              {/*
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
                    value={String(local.coeficiente)}
                    onChangeText={(value) =>
                      setLocal((prev) => ({
                        ...prev,
                        coeficiente: Number(value) || 0,
                      }))
                    }
                    style={[styles.inputStyle, { minHeight: 44, fontSize: 14 }]}
                  />
                </View>
              */}
              </View>
            )}

            <Input
              label={t("inspectionModal.notes")}
              multiline
              value={local.observacoes}
              onChangeText={(text) =>
                setLocal((prev) => ({
                  ...prev,
                  observacoes: text,
                }))
              }
              style={styles.inputStyle}
            />

            <View>
              <Text style={styles.sectionTitle}>
                {t("inspectionModal.photos")} ({local.fotos?.length}/2)
              </Text>

              <View style={styles.grid}>
                {Array.from({ length: Math.max(photos.length + 1, 2) })
                  .slice(0, 2)
                  .map((_, index) => {
                    const photo = photos[index];

                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.photoBox}
                        onPress={() => {
                          if (photo) return;
                          
                          takePhoto();
                        }}
                        onLongPress={() => {
                          if (photo) return;
                          takePhoto();
                        }}
                      >
                        {photo ? (
                          <>
                            <TouchableOpacity
                              onPress={() =>
                                handleOpenImage(
                                  photo.type === "existing"
                                    ? photo.uri
                                    : photo.asset.uri,
                                )
                              }
                              style={{ width: "100%", height: "100%" }}
                            >
                              {photo.type === "existing" && (
                                <Image
                                  source={{ uri: photo.uri }}
                                  style={styles.photo}
                                />
                              )}

                              {photo.type === "new" && (
                                <Image
                                  source={{ uri: photo.asset.uri }}
                                  style={styles.photo}
                                />
                              )}
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.removePhoto}
                              onPress={(e) => {
                                e.stopPropagation();
                                removePhoto(index);
                              }}
                            >
                              <Text style={styles.removePhotoText}>✕</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="camera-outline"
                              size={28}
                              color="#6b7280"
                            />

                            <Text style={styles.photoCounter}>
                              {index + 1}/2
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>
                  {t("inspectionModal.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {t("inspectionModal.save")}
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

  photosHint: {
    marginBottom: 8,
    fontSize: 12,
    color: colors.textMuted,
  },

  addPhotoIcon: {
    fontSize: 28,
    color: colors.textMuted,
    fontWeight: "600",
  },

  photoCounter: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },

  removePhoto: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },

  removePhotoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },

  addPhotoButton: {
    width: 90,
    height: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.backgroundSurface,
    alignItems: "center",
    justifyContent: "center",
  },

  addPhotoText: {
    color: colors.textMuted,
    fontWeight: "600",
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

  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: colors.black,
    fontWeight: "700",
  },

  inputStyle: {
    backgroundColor: colors.backgroundBase,
    borderWidth: 1,
    borderColor: colors.borderMuted,
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
});
