export type AuthStackParamList = {
  CameraPermission: { onGrant: () => void};
  GalleryPermission: {onGrant: () => void};
  NotificationPermission: {onGrant: () => void};
};