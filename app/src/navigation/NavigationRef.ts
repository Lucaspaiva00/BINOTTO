import { createNavigationContainerRef, NavigationState } from "@react-navigation/native";

import { RootStackParamList } from "@/routes/types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<T extends keyof RootStackParamList>(name: T, params?: RootStackParamList[T]) {
  if (!navigationRef.isReady()) {
    return;
  }

  if (params !== undefined) {
    navigationRef.navigate(name as any, params as any);
    return;
  }

  navigationRef.navigate(name as any);
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function getCurrentRoute() {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }

  return null;
}

export function reset<T extends keyof RootStackParamList>(routeName: T, params?: RootStackParamList[T]) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  }
}

export function canGoBack(): boolean {
  if (navigationRef.isReady()) {
    return navigationRef.canGoBack();
  }

  return false;
}

export function getState(): NavigationState | undefined {
  if (navigationRef.isReady()) {
    return navigationRef.getState();
  }

  return undefined;
}
