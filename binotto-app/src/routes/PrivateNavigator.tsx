import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/theme/colors";

// PermissionScreens
import { CameraPermissionScreen } from "@/screens/permissions/CameraPermissionScreen";
import { GalleryPermissionScreen } from "@/screens/permissions/GalleryPermissionScreen";
import { NotificationPermissionScreen } from "@/screens/permissions/NotificationPermissionScreen";

// WorkshopScreens
import WorkshopDashboardScreen from "@/screens/workshop/WorkshopDashboardScreen";
import WorkshopCalendarScreen from "@/screens/workshop/WorkshopCalendarScreen";
import WorkshopPriorityTechsScreen from "@/screens/workshop/WorkshopPriorityTechsScreen";
import WorkshopSettingsScreen from "@/screens/workshop/WorkshopSettingsScreen";
import WorkshopInspectionsScreen from "@/screens/workshop/WorkshopInspectionsScreen";
import WorkshopNewInspectionScreen from "@/screens/workshop/WorkshopNewInspectionScreen";
import WorkshopServiceUpdateScreen from "@/screens/workshop/WorkshopServiceUpdateScreen";
import WorkshopServiceDetailsScreen from "@/screens/workshop/WorkshopServiceDetailsScreen";
import WorkshopConfirmServiceScreen from "@/screens/workshop/WorkshopConfirmServiceScreen";
import WorkshopInspectionDetailsScreen from "@/screens/workshop/WorkshopInspectionDetailsScreen";

// TechnicianScreens
import TechnicianDashboardScreen from "@/screens/tech/TechnicianDashboardScreen";
import TechnicianInspectionsScreen from "@/screens/tech/TechnicianInspectionsScreen";
import TechnicianNewInspectionScreen from "@/screens/tech/TechnicianNewInspectionScreen";
import TechnicianSettingsScreen from "@/screens/tech/TechnicianSettingsScreen";
import TechnicianCalendarScreen from "@/screens/tech/TechnicianCalendarScreen";
import TechnicianServiceExecutionScreen from "@/screens/tech/TechnicianServiceExecutionScreen";
import TechnicianServiceDetailsScreen from "@/screens/tech/TechnicianServiceDetailsScreen";
import TechnicianNewServiceScreen from "@/screens/tech/TechnicianNewServiceScreen";
import TechnicianInspectionDetailsScreen from "@/screens/tech/TechnicianInspectionDetailsScreen";
import TechnicianInspectionSavedScreen from "@/screens/tech/TechnicianInspectionSavedScreen";
import TechnicianServiceAcceptScreen from "@/screens/tech/TechnicianServiceAcceptScreen";

import {
  PrivateStackParamList,
  TechnicianStackParamList,
  WorkshopStackParamList,
} from "@/routes/types";
import { useTranslation } from "react-i18next";

const PrivateStack = createNativeStackNavigator<PrivateStackParamList>();
const TechnicianTabs = createBottomTabNavigator<TechnicianStackParamList>();
const WorkshopTabs = createBottomTabNavigator<WorkshopStackParamList>();

import Svg, { Path, Rect } from "react-native-svg";
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Settings,
  Users,
} from "lucide-react-native";
import TechnicianCompleteCarScreen from "@/screens/tech/TechnicianCompleteCarScreen";

function TechnicianTabsNavigator(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <TechnicianTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundBase,
          borderTopColor: colors.borderMuted,
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => {
          const iconByRoute: Record<
            Exclude<
              keyof TechnicianStackParamList,
              | "NewInspection"
              | "NewService"
              | "ServiceDetail"
              | "ServiceExecution"
              | "ServiceAccept"
              | "CompleteCar"
              | "InspectionDetail"
              | "InspectionSaved"
            >,
            string
          > = {
            Dashboard: "view-dashboard-outline",
            Inspections: "clipboard-list-outline",
            Calendar: "calendar-month-outline",
            Settings: "cog-outline",
          };

          const iconName = iconByRoute[route.name as keyof typeof iconByRoute];

          if (route.name === "Dashboard") {
            return (
              <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            );
          }

          if (route.name === "Calendar") {
            return <CalendarDays size={size} color={color} strokeWidth={2} />;
          }

          if (route.name === "Settings") {
            return <Settings size={size} color={color} strokeWidth={2} />;
          }

          if (route.name === "Inspections") {
            return <ClipboardCheck size={size} color={color} strokeWidth={2} />;
          }

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <TechnicianTabs.Screen
        name="Dashboard"
        component={TechnicianDashboardScreen}
        options={{ tabBarLabel: t("tabs.home") }}
      />

      <TechnicianTabs.Screen
        name="Inspections"
        component={TechnicianInspectionsScreen}
        options={{ tabBarLabel: t("tabs.inspections") }}
      />

      <TechnicianTabs.Screen
        name="Calendar"
        component={TechnicianCalendarScreen}
        options={{ tabBarLabel: t("tabs.calendar") }}
      />

      <TechnicianTabs.Screen
        name="Settings"
        component={TechnicianSettingsScreen}
        options={{ tabBarLabel: t("tabs.settings") }}
      />

      <TechnicianTabs.Screen
        name="NewInspection"
        component={TechnicianNewInspectionScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <TechnicianTabs.Screen
        name="NewService"
        component={TechnicianNewServiceScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <TechnicianTabs.Screen
        name="ServiceDetail"
        component={TechnicianServiceDetailsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <TechnicianTabs.Screen
        name="ServiceExecution"
        component={TechnicianServiceExecutionScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <TechnicianTabs.Screen
        name="ServiceAccept"
        component={TechnicianServiceAcceptScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <TechnicianTabs.Screen
        name="CompleteCar"
        component={TechnicianCompleteCarScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <TechnicianTabs.Screen
        name="InspectionSaved"
        component={TechnicianInspectionSavedScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <TechnicianTabs.Screen
        name="InspectionDetail"
        component={TechnicianInspectionDetailsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </TechnicianTabs.Navigator>
  );
}

function WorkshopTabsNavigator(): JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <WorkshopTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundBase,
          borderTopColor: colors.borderMuted,
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, size }) => {
          const iconByRoute: Record<
            Exclude<
              keyof WorkshopStackParamList,
              | "ServiceUpdate"
              | "ServiceDetail"
              | "NewInspection"
              | "ServiceConfirm"
              | "InspectionDetails"
            >,
            string
          > = {
            Dashboard: "view-dashboard-outline",
            Calendar: "calendar-month-outline",
            Inspections: "clipboard-list-outline",
            Technicians: "account-group-outline",
            Settings: "cog-outline",
          };

          const iconName = iconByRoute[route.name as keyof typeof iconByRoute];

          if (route.name === "Dashboard") {
            return (
              <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            );
          }

          if (route.name === "Calendar") {
            return <CalendarDays size={size} color={color} strokeWidth={2} />;
          }

          if (route.name === "Settings") {
            return <Settings size={size} color={color} strokeWidth={2} />;
          }

          if (route.name === "Inspections") {
            return <ClipboardList size={size} color={color} strokeWidth={2} />;
          }

          if (route.name === "Technicians") {
            return <Users size={size} color={color} strokeWidth={2} />;
          }

          return (
            <MaterialCommunityIcons
              name={iconName as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <WorkshopTabs.Screen
        name="Dashboard"
        component={WorkshopDashboardScreen}
        options={{ tabBarLabel: t("tabs.home") }}
      />

      <WorkshopTabs.Screen
        name="Calendar"
        component={WorkshopCalendarScreen}
        options={{ tabBarLabel: t("tabs.calendar") }}
      />

      <WorkshopTabs.Screen
        name="Inspections"
        component={WorkshopInspectionsScreen}
        options={{ tabBarLabel: t("tabs.inspections") }}
      />

      <WorkshopTabs.Screen
        name="Technicians"
        component={WorkshopPriorityTechsScreen}
        options={{ tabBarLabel: t("tabs.technicians") }}
      />

      <WorkshopTabs.Screen
        name="Settings"
        component={WorkshopSettingsScreen}
        options={{ tabBarLabel: t("tabs.settings") }}
      />

      <WorkshopTabs.Screen
        name="ServiceUpdate"
        component={WorkshopServiceUpdateScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <WorkshopTabs.Screen
        name="ServiceDetail"
        component={WorkshopServiceDetailsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <WorkshopTabs.Screen
        name="ServiceConfirm"
        component={WorkshopConfirmServiceScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <WorkshopTabs.Screen
        name="InspectionDetails"
        component={WorkshopInspectionDetailsScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />

      <WorkshopTabs.Screen
        name="NewInspection"
        component={WorkshopNewInspectionScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </WorkshopTabs.Navigator>
  );
}

export function PrivateNavigator(): JSX.Element {
  const { authData } = useAuth();
  const role = authData?.profile;
  const isTechnician = role === "TECNICO";

  return (
    <PrivateStack.Navigator screenOptions={{ headerShown: false }}>
      {isTechnician ? (
        <PrivateStack.Screen
          name="TechnicianTabs"
          component={TechnicianTabsNavigator}
        />
      ) : (
        <PrivateStack.Screen
          name="WorkshopTabs"
          component={WorkshopTabsNavigator}
        />
      )}

      <PrivateStack.Screen
        name="CameraPermission"
        component={CameraPermissionScreen}
       
      />
      <PrivateStack.Screen
        name="GalleryPermission"
        component={GalleryPermissionScreen}
       
      />
      <PrivateStack.Screen
        name="NotificationPermission"
        component={NotificationPermissionScreen}
       
      />
    </PrivateStack.Navigator>
  );
}
