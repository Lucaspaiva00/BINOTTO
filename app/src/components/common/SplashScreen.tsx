import { colors } from "@/theme/colors";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type SplashScreenProps = {
  message: string;
};

export function SplashScreen({ message }: SplashScreenProps): JSX.Element {
  return (
    <View style={styles.splashContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.splashText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  splashText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
