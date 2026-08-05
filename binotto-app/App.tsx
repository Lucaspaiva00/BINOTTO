import "@/i18n";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthProvider } from "@/contexts/AuthContext";
import { navigationRef } from "@/navigation/NavigationRef";
import { RootNavigator } from "@/routes/RootNavigator";
import { colors } from "@/theme/colors";
import { LanguageContextProvider } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import PermissionController from "@/controllers/permission.controller";
import * as Notifications from "expo-notifications";
import { handleNotificationNavigation } from "@/routes/NotificationRouter";
import {
  StatusBar as RNStatusBar,
  Text,
  TextInput,
  LogBox,
} from "react-native";

LogBox.ignoreLogs([
  "Support for defaultProps will be removed from function components",
]);

const customTextProps = {
  style: {
    fontFamily: "Helvetica",
  },
};

(Text as any).defaultProps = customTextProps;
(TextInput as any).defaultProps = customTextProps;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

export default function App(): JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Helvetica: require("@/assets/fonts/Helvetica.ttf"),
    "Helvetica-Bold": require("@/assets/fonts/Helvetica-Bold.ttf"),
    "Helvetica-Oblique": require("@/assets/fonts/Helvetica-Oblique.ttf"),
    "Helvetica-BoldOblique": require("@/assets/fonts/Helvetica-BoldOblique.ttf"),
    "Helvetica-Light": require("@/assets/fonts/helvetica-light-587ebe5a59211.ttf"),
  });

  // Pede permissão para notificações
  useEffect(() => {
    async function initNotifications() {
      try {
        const granted =
          await PermissionController.requestNotificationPermission();
        if (!granted) return;
      } catch (error) {}
    }

    initNotifications();

    GoogleSignin.configure({
      webClientId: '513219470339-ols2tk9t53gun7kenai06upb3usv5rvb.apps.googleusercontent.com',
      iosClientId: '513219470339-l4eqnf9gh3if1co7v0el2eiuuis50ud8.apps.googleusercontent.com', 
    });
  }, []);

  // isso permite que entre em determinadas telas quando o usuário clicar em uma notificação
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        handleNotificationNavigation(data);
      },
    );

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RNStatusBar
        backgroundColor={colors.primary}
        barStyle="dark-content"
        translucent={false}
      />
      <LanguageContextProvider>
        <AuthProvider>
          <NavigationContainer ref={navigationRef} theme={navigationTheme}>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LanguageContextProvider>
    </GestureHandlerRootView>
  );
}
