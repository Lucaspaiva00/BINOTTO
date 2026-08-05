import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";

class PermissionController {
  static async checkCameraPermission(navigation: any, onGrant: () => void) {
    const { status } = await ImagePicker.getCameraPermissionsAsync();

    if (status === "granted") {
      return onGrant();
    }

    navigation.navigate("CameraPermission", { onGrant });
  }

  static async requestCameraPermission() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  }

  static async checkGalleryPermission(navigation: any, onGrant: () => void) {

    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (status === "granted") {
      return onGrant();
    }

    navigation.navigate("GalleryPermission", { onGrant });
  }

  static async requestGalleryPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }

  static async checkNotificationPermission(navigation: any, onGrant: () => void) {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === "granted") {
      return onGrant();
    }

    navigation.navigate("NotificationPermission", {
      onGrant,
    });
  }

  static async requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();

    return status === "granted";
  }
}

export default PermissionController;
