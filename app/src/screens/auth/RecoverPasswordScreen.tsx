import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/common/ScreenContainer";
import { PublicStackParamList } from "@/routes/types";
import { colors } from "@/theme/colors";
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<PublicStackParamList, "RecoverPassword">;

export function RecoverPasswordScreen({ navigation }: Props): JSX.Element {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#A8AFBB" />
          <Text allowFontScaling={false} style={styles.backText}>
            {t("recoverPasswordScreen.back")}
          </Text>
        </Pressable>

        <Text allowFontScaling={false} style={styles.title}>
          {t("recoverPasswordScreen.title")}
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          {t("recoverPasswordScreen.subtitle")}
        </Text>

        <Pressable
          style={styles.card}
          onPress={() => navigation.navigate("RecoverByEmail")}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="email-outline"
              size={22}
              color="#D9DEE7"
            />
          </View>
          <View style={styles.cardContent}>
            <Text allowFontScaling={false} style={styles.cardTitle}>
              {t("recoverPasswordScreen.emailTitle")}
            </Text>
            <Text allowFontScaling={false} style={styles.cardDescription}>
              {t("recoverPasswordScreen.emailDescription")}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.card, styles.disabledCard]}
          onPress={() =>
            Alert.alert(
              t("recoverPasswordScreen.comingSoonTitle"),
              t("recoverPasswordScreen.whatsappUnavailable"),
            )
          }
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="chat-processing-outline"
              size={22}
              color="#AEB4BF"
            />
          </View>
          <View style={styles.cardContent}>
            <Text
              allowFontScaling={false}
              style={[styles.cardTitle, styles.disabledTitle]}
            >
              {t("recoverPasswordScreen.whatsappTitle")}
            </Text>
            <Text allowFontScaling={false} style={styles.cardDescription}>
              {t("recoverPasswordScreen.whatsappDescription")}
            </Text>
          </View>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  backText: {
    color: "#A8AFBB",
    fontSize: 17,
    fontWeight: "500",
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 17,
    marginBottom: 16,
  },
  card: {
    height: 84,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#4B505A",
    backgroundColor: "#12151B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  disabledCard: {
    borderColor: "#373C45",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1D222B",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  disabledTitle: {
    color: "#B7BDC7",
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
