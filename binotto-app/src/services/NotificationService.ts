import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export async function getPushToken() {
  if (!Device.isDevice) {
    return null;
  }

  const permission = await Notifications.getPermissionsAsync();

  if (permission.status !== "granted") {
    return null;
  }

  const token = await Notifications.getDevicePushTokenAsync();

  return token.data;
}