import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors } from "@/theme/colors";

export function SocialLoginMock(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>ou entre com</Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <MaterialCommunityIcons name="google" size={20} color={colors.text} />
          <Text style={styles.text}>Google</Text>
        </View>
        <View style={styles.item}>
          <MaterialCommunityIcons name="facebook" size={20} color={colors.text} />
          <Text style={styles.text}>Facebook</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    gap: 10
  },
  label: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 13
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  item: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  text: {
    color: colors.text,
    fontWeight: "600"
  }
});

