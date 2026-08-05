import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "@/screens/auth/LoginScreen";
import { CompleteRegistrationScreen } from "@/screens/auth/CompleteRegistrationScreen";
import { RegisterTechnicianScreen } from "@/screens/auth/RegisterTechnicianScreen";
import { RegisterWorkshopScreen } from "@/screens/auth/RegisterWorkshopScreen";
import { RecoverPasswordScreen } from "@/screens/auth/RecoverPasswordScreen";
import { RecoverByEmailScreen } from "@/screens/auth/RecoverByEmailScreen";
import { OtpValidationScreen } from "@/screens/auth/OtpValidationScreen";
import { PublicStackParamList } from "@/routes/types";
import { colors } from "@/theme/colors";
import { CameraPermissionScreen } from "@/screens/permissions/CameraPermissionScreen";
import { GalleryPermissionScreen } from "@/screens/permissions/GalleryPermissionScreen";
import { NotificationPermissionScreen } from "@/screens/permissions/NotificationPermissionScreen";
import { CompleteRegistrationSocialScreen } from "@/screens/auth/CompleteRegistrationSocialScreen";

const Stack = createNativeStackNavigator<PublicStackParamList>();

export function PublicNavigator(): JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RegisterTechnician"
        component={RegisterTechnicianScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RegisterWorkshop"
        component={RegisterWorkshopScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CompleteRegistration"
        component={CompleteRegistrationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CompleteRegistrationSocial"
        component={CompleteRegistrationSocialScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecoverPassword"
        component={RecoverPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecoverByEmail"
        component={RecoverByEmailScreen}
        options={{ title: "Enviar Código" }}
      />
      <Stack.Screen
        name="OtpValidation"
        component={OtpValidationScreen}
        options={{ title: "Validar Código" }}
      />
      <Stack.Screen
        name="CameraPermission"
        component={CameraPermissionScreen}
        options={{ title: "Permissão de Câmera" }}
      />
      <Stack.Screen
        name={"GalleryPermission" as keyof PublicStackParamList}
        component={GalleryPermissionScreen}
        options={{ title: "Permissão de Galeria" }}
      />
      <Stack.Screen
        name="NotificationPermission"
        component={NotificationPermissionScreen}
        options={{ title: "Permissão de Notificações" }}
      />
    </Stack.Navigator>
  );
}
