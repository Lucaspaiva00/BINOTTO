import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { Input } from "@/components/common/Input";
import { PrimaryButton } from "@/components/common/PrimaryButton";
import { useTranslation } from "react-i18next";

type Props = {
  visible: boolean;
  loading?: boolean;
  i18nRootKey: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function DeleteAccountModal({
  visible,
  loading = false,
  i18nRootKey,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [a, setA] = useState(2);
  const [b, setB] = useState(5);
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!visible) return;
    setA(randomInt(1, 9));
    setB(randomInt(1, 9));
    setAnswer("");
  }, [visible]);

  const expected = useMemo(() => a + b, [a, b]);

  const isCorrect = useMemo(() => {
    const parsed = Number(answer.replace(",", "."));
    return Number.isFinite(parsed) && parsed === expected;
  }, [answer, expected]);

  const equation = `${a} + ${b}`;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{t(`${i18nRootKey}.title`)}</Text>
          <Text style={styles.subtitle}>{t(`${i18nRootKey}.subtitle`)}</Text>

          <View style={styles.box}>
            <Text style={styles.equationLabel}>
              {t(`${i18nRootKey}.mathPrompt`, { equation })}
            </Text>
            <Input
              keyboardType="numeric"
              value={answer}
              onChangeText={setAnswer}
              placeholder={t(`${i18nRootKey}.answerPlaceholder`)}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>
                {t(`${i18nRootKey}.cancel`)}
              </Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={
                  loading
                    ? t(`${i18nRootKey}.deleting`)
                    : t(`${i18nRootKey}.confirm`)
                }
                onPress={onConfirm}
                disabled={!isCorrect || loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  container: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: colors.backgroundBase,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  box: {
    marginTop: 16,
    gap: 10,
  },

  equationLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    marginTop: 18,
    gap: 10,
    alignItems: "center",
  },

  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  cancelText: {
    color: colors.text,
    fontWeight: "700",
  },
});
