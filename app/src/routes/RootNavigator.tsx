import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "@/contexts/AuthContext";
import { PublicNavigator } from "@/routes/PublicNavigator";
import { PrivateNavigator } from "@/routes/PrivateNavigator";
import { RootStackParamList } from "@/routes/types";
import { SplashScreen } from "@/components/common/SplashScreen";
import { useTranslation } from "react-i18next";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): JSX.Element {
  const { authToken, loading } = useAuth();
  const { t } = useTranslation();

  if(loading){
    return <SplashScreen message={t("common.loading")} />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authToken ? (
        <Stack.Screen name="PrivateStack" component={PrivateNavigator} />
      ) : (
        <Stack.Screen name="PublicStack" component={PublicNavigator} />
      )}
    </Stack.Navigator>
  );
}