import React, { useState, useRef, useMemo } from "react";
import { ChoiceGroup, IChoiceGroupOption, SpinButton, DefaultButton, Dropdown, IDropdownOption } from '@fluentui/react';
import { useId } from "@fluentui/react-hooks";
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
    onDataLoading: (p: number) => void;
}
const FileData: React.FC<FileDataProps> = (props) => {
    const { onClose, onDataLoaded, onStartLoading, onLoadingFailed, onDataLoading } = props;
    const sampleOptions = useSampleOptions();
    const labelId = useId("labelElement");
    const [sampleMethod, setSampleMethod] = useState<SampleKey>(SampleKey.none);
    const [sampleSize, setSampleSize] = useState<number>(500);
    const fileEle = useRef<HTMLInputElement>(null);
    const [chartset, setcharSet] = useState<string>('utf-8');

    const charsetOptions = useMemo<IDropdownOption[]>(() => {
        return [
            {
                text: 'UTF-8',
                key: 'utf-8'
            },
            {
                text: 'GB2312',
                key: 'gb2312'
            },
            {
                text: 'US-ASCII',
                key: 'us-ascii'
            },
            {
                text: 'Big5',
                key: 'big5'
            },
            {
                text: 'Big5-HKSCS',
                key: 'Big5-HKSCS'
            },
            {
                text: 'GB18030',
                key: 'GB18030'
            },
        ]
    }, [])

    async function fileUploadHanlder() {
        if (fileEle.current !== null && fileEle.current.files !== null) {
            const file = fileEle.current.files[0];
            onStartLoading();
            try {
                const { fields, dataSource } = await loadDataFile({
                    file,
                    sampleMethod,
                    sampleSize,
                    encoding: chartset,
                    onLoading: onDataLoading
                });
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
            <div style={{ margin: '1em 0em' }}>
                <Dropdown label={intl.get('dataSource.charset')}
                    style={{ maxWidth: '120px' }}
                    options={charsetOptions}
                    selectedKey={chartset}
                    onChange={(e, item) => {
                        item && setcharSet(item.key as string)
                    }}
                />
            </div>
            <div>
                <ChoiceGroup
                    label={intl.get("dataSource.upload.sampling")}
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
