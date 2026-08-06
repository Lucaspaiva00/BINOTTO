import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";

import { PrimaryButton } from "@/components/common/PrimaryButton";
import { colors } from "@/theme/colors";
import PermissionController from "@/controllers/permission.controller";
import { AuthStackParamList } from "@/navigation/types";
import AppHeader from "@/components/common/AppHeader";

type NotificationPermissionRouteProp = RouteProp<
  AuthStackParamList,
  "NotificationPermission"
>;
type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export function NotificationPermissionScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<NotificationPermissionRouteProp>();
  const { onGrant } = route.params;

  const handleRequestPermission = async () => {
    const granted = await PermissionController.requestNotificationPermission();
    if (granted) {
      onGrant();
      navigation.goBack();
    }
  };

  return (
    <View style={[{ paddingTop: 0, flex: 1 }]}>
      <AppHeader
        logo={require("@/assets/binotto-dog-logo-cropped.png")}
        title={t("notification.title")}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={80}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>{t("notification.title")}</Text>

          <Text style={styles.description}>
            {t("notification.description")}
          </Text>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title={t("common.continue")}
            onPress={handleRequestPermission}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    marginTop: 40,
    width: "100%",
  },
});