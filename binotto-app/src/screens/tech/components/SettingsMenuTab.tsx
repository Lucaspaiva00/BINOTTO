import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import MenuItem from "@/components/common/MenuItemSettings";
import { colors } from "@/theme/colors";
import { ViewType } from "../TechnicianSettingsScreen";

type Props = {
  onSelectMenu: (menu: ViewType) => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
};

export default function SettingsMenuTab({
  onSelectMenu,
  onSignOut,
  onDeleteAccount,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.list}>
      <MenuItem
        icon="web"
        label={t("technicianSettingsScreen.menu.language")}
        onPress={() => onSelectMenu("language")}
      />

      <MenuItem
        icon="account-outline"
        label={t("technicianSettingsScreen.menu.profile")}
        onPress={() => onSelectMenu("profile")}
      />

      <MenuItem
        icon="file-document-outline"
        label={t("technicianSettingsScreen.menu.documents")}
        onPress={() => onSelectMenu("documents")}
      />

      <MenuItem
        icon="headset"
        label={t("technicianSettingsScreen.menu.support")}
        onPress={() => onSelectMenu("support")}
      />

      <MenuItem
        icon="lock-outline"
        label={t("technicianSettingsScreen.menu.password")}
        onPress={() => onSelectMenu("password")}
      />

      <MenuItem
        icon="power"
        label={t("technicianSettingsScreen.menu.signOut")}
        onPress={onSignOut}
        danger
      />

      <Pressable onPress={onDeleteAccount} style={styles.deleteAccountWrapper}>
        <Text style={styles.deleteAccountText}>
          {t("technicianSettingsScreen.menu.deleteAccount")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },

  deleteAccountWrapper: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
  },

  deleteAccountText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
    opacity: 0.75,
  },
});
