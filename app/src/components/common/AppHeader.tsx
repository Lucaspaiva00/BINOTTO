import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";

interface AppHeaderProps {
  logo: any;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showLenguageButton?: any;
}

export default function AppHeader({
  logo,
  title,
  subtitle,
  onBack,
  showLenguageButton,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backBtn}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={colors.black}
              />
            </Pressable>
          )}

          <Image source={logo} resizeMode="contain" style={styles.headerLogo} />

          <View>
            {title && <Text style={styles.headerTitle}>{title}</Text>}
            {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          </View>
        </View>

        {showLenguageButton ? showLenguageButton : undefined}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 8,
    justifyContent: "space-between",
  },

  headerTitle: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: colors.black,
    fontSize: 14,
  },

  headerLogo: {
    width: 56,
    height: 56,
  },

  backBtn: {
    marginRight: 6,
  },
});
