import React, { useState, useRef } from "react";
import { Label, ChoiceGroup, IChoiceGroupOption, SpinButton, DefaultButton } from "office-ui-fabric-react";
import { useId } from "@uifabric/react-hooks";
import intl from "react-intl-universal";
import { loadDataFile, SampleKey, useSampleOptions } from "../utils";
import { dataBackup, logDataImport } from "../../../loggers/dataImport";
import { IMuteFieldBase, IRow } from "../../../interfaces";
import { setDataStorage } from "../../../utils/storage";

interface FileDataProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[]) => void;
}
const FileData: React.FC<FileDataProps> = (props) => {
    const { onClose, onDataLoaded, onStartLoading, onLoadingFailed } = props;
    const sampleOptions = useSampleOptions();
    const labelId = useId("labelElement");
    const [sampleMethod, setSampleMethod] = useState<SampleKey>(SampleKey.none);
    const [sampleSize, setSampleSize] = useState<number>(500);
    const fileEle = useRef<HTMLInputElement>(null);

    async function fileUploadHanlder() {
        if (fileEle.current !== null && fileEle.current.files !== null) {
            const file = fileEle.current.files[0];
            onStartLoading();
            try {
                const { fields, dataSource } = await loadDataFile(file, sampleMethod, sampleSize);
                logDataImport({
                    dataType: 'File',
                    fields,
                    dataSource: dataSource.slice(0, 10),
                    size: dataSource.length
                });
                dataBackup(file);
                setDataStorage(file.name, fields, dataSource)
                onDataLoaded(fields, dataSource);
            } catch (error) {
                onLoadingFailed(error)
            }
            onClose();
        }
    }

    return (
        <div>
            <div className="vi-callout-content">
                <p className="vi-callout-subTex">{intl.get("dataSource.upload.fileTypes")}</p>
            </div>
            <div>
                <Label id={labelId} required={true}>
                    {intl.get("dataSource.upload.sampling")}
                </Label>
                <ChoiceGroup
                    options={sampleOptions}
                    selectedKey={sampleMethod}
                    onChange={(ev: any, option: IChoiceGroupOption | undefined) => {
                        if (option) {
                            setSampleMethod(option.key as SampleKey);
                        }
                    }}
                    ariaLabelledBy={labelId}
                />
                {sampleMethod === SampleKey.reservoir && (
                    <SpinButton
                        label={intl.get("dataSource.upload.percentSize")}
                        min={0}
                        step={1}
                        value={sampleSize.toString()}
                        onValidate={(value) => {
                            setSampleSize(Number(value));
                        }}
                        onIncrement={() => {
                            setSampleSize((v) => v + 1);
                        }}
                        onDecrement={() => {
                            setSampleSize((v) => Math.max(v - 1, 0));
                        }}
                    />
                )}
            </div>
            <div className="vi-callout-actions">
                <input type="file" ref={fileEle} multiple accept="*" style={{ display: "none" }} onChange={fileUploadHanlder} />
                <DefaultButton
                    text={intl.get("dataSource.upload.upload")}
                    iconProps={{ iconName: "Upload" }}
                    onClick={() => {
                        if (fileEle.current) {
                            fileEle.current.click();
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default FileData;
