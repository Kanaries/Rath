import React, { useRef } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
interface CorpProps {
    imgUrl: string;
    onChangeFileImg: (file: any) => void;
}
const Corp: React.FC<CorpProps> = (props) => {
    const cropperRef = useRef<HTMLImageElement>(null);
    const { imgUrl, onChangeFileImg } = props;
    const onCrop = (event: CustomEvent<any>) => {
        const imageElement: any = cropperRef?.current;
        const cropper: any = imageElement?.cropper;
        cropper.getCroppedCanvas().toBlob((blob: BlobPart) => {
            const file = new File([blob], "head.jpg");
            onChangeFileImg(file);
        });
    };

    return (
        <Cropper
            src={imgUrl}
            viewMode={1}
            dragMode="move"
            autoCropArea={1}
            style={{ height: 384, width: 800 }}
            cropBoxResizable={true}
            initialAspectRatio={1}
            guides={true}
            crop={onCrop}
            ref={cropperRef}
        />
    );
};
export default Corp;
