import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export async function getPushToken() {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const permission = await Notifications.getPermissionsAsync();

    if (permission.status !== "granted") {
      return null;
    }

    const token = await Notifications.getDevicePushTokenAsync();

    return token.data;
  } catch (error) {
    console.log("[PUSH_TOKEN_ERROR]", error);
    return null;
  }
}