import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppHeader from "@/components/common/AppHeader";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react-native";

export default function ComingSoon({ title }: { title: string }) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 0,
        backgroundColor: colors.background,
      }}
    >
      {/* HEADER */}
      <AppHeader
        logo={require("@/assets/binotto-dog-logo-cropped.png")}
        title={title}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.containerComing}>
        <View style={styles.iconContainer}>
          <Clock size={64} color={colors.primary} />
        </View>

        <Text style={styles.title}>{t("comingSoonScreen.title")}</Text>

        <Text style={styles.subtitle}>{t("comingSoonScreen.subtitle")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  containerComing: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundSurface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
