import React from "react";
import ImageViewing from "react-native-image-viewing";

type Props = {
    visible: boolean;
    image: string | null;
    onClose: () => void;
};

export default function ImageViewerModal({
    visible,
    image,
    onClose,
}: Props) {
    return (
        <ImageViewing
            images={image ? [{ uri: image }] : []}
            imageIndex={0}
            visible={visible}
            onRequestClose={onClose}
            presentationStyle="fullScreen"
            swipeToCloseEnabled
            doubleTapToZoomEnabled
        />
    );
}
