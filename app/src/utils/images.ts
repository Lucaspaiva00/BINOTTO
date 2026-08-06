import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export const optimizeImage = async (
  asset: ImagePicker.ImagePickerAsset,
) => {
  const result = await manipulateAsync(
    asset.uri,
    [
      {
        resize: {
          width: 1280,
        },
      },
    ],
    {
      compress: 0.7,
      format: SaveFormat.JPEG,
    },
  );

  return {
    ...asset,
    uri: result.uri,
    width: result.width,
    height: result.height,
    fileName: asset.fileName ?? `photo_${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
};