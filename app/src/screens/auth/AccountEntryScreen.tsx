import React from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import type { PublicStackParamList } from "@/routes/types";
import { colors } from "@/theme/colors";

type EntryProps = NativeStackScreenProps<PublicStackParamList, "AccountEntry">;
type AccessProps = NativeStackScreenProps<PublicStackParamList, "ProfileAccess">;

export function AccountEntryScreen({ navigation }: EntryProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Binotto PDR</Text>
        <Text style={styles.subtitle}>{t("accountEntry.choose")}</Text>
        <TouchableOpacity accessibilityRole="button" style={[styles.option, styles.unavailable]} disabled>
          <Text style={styles.optionText}>{t("accountEntry.admin")}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => navigation.navigate("ProfileAccess", { profile: "technician" })}>
          <Text style={styles.primaryText}>{t("accountEntry.technician")}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={[styles.option, styles.unavailable]} disabled>
          <Text style={styles.optionText}>{t("accountEntry.dismantler")}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => navigation.navigate("ProfileAccess", { profile: "workshop" })}>
          <Text style={styles.primaryText}>{t("accountEntry.workshop")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ProfileAccessScreen({ navigation, route }: AccessProps): JSX.Element {
  const { t } = useTranslation();
  const technician = route.params.profile === "technician";
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t(technician ? "accountEntry.technician" : "accountEntry.workshop")}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.primaryText}>{t("accountEntry.login")}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.option} onPress={() => {
          if (technician) navigation.navigate("RegisterTechnician");
          else navigation.navigate("RegisterWorkshop");
        }}>
          <Text style={styles.optionText}>{t("accountEntry.register")}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.optionText}>{t("accountEntry.back")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 14 },
  title: { fontSize: 28, fontWeight: "700", color: colors.white },
  subtitle: { color: colors.textMuted, fontSize: 15, marginBottom: 12 },
  primary: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: "center" },
  primaryText: { color: colors.black, fontWeight: "700" },
  option: { borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: 16, alignItems: "center" },
  optionText: { color: colors.white, fontWeight: "600" },
  unavailable: { opacity: 0.65 },
  back: { alignItems: "center", padding: 12 },
});
