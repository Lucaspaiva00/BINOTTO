import React, { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

type ScreenContainerProps = PropsWithChildren<{
  withScroll?: boolean;
  padding?: number;
  removeSafeArea?: boolean;
}>;

export function ScreenContainer({
  children,
  padding = 16,
  withScroll = true,
  removeSafeArea = false,
}: ScreenContainerProps): JSX.Element {
  const content = <View style={[styles.content, { padding }]}>{children}</View>;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.wrapper}
    >
      {!removeSafeArea ? (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          {withScroll ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {content}
            </ScrollView>
          ) : (
            content
          )}
        </SafeAreaView>
      ) : (
        <View style={styles.safeArea}>
          withScroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
          ) : ( content )
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingBottom: -150,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
