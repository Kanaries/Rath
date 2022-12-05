import { FC, useState, useRef, useCallback, useEffect } from "react";
import { PrimaryButton } from '@fluentui/react';
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import intl from "react-intl-universal";
import { loadDataFile, readRaw, SampleKey } from "../../utils";
import { dataBackup, logDataImport } from "../../../../loggers/dataImport";
import type { IMuteFieldBase, IRow } from "../../../../interfaces";
import FileUpload from "./file-upload";
import HistoryList from "./history-list";
import FileHelper, { Charset } from "./file-helper";


const Container = styled.div`
    width: 55vw;
    > header {
        margin-top: 1.2em;
        font-weight: 550;
    }
    > .action {
        margin: 1em 0;
    }
`;

interface FileDataProps {
    onClose: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name?: string) => void;
    onDataLoading: (p: number) => void;
    toggleLoadingAnimation: (on: boolean) => void;
}

const FileData: FC<FileDataProps> = (props) => {
    const { onClose, onDataLoaded, onLoadingFailed, onDataLoading, toggleLoadingAnimation } = props;
    const [sampleMethod, setSampleMethod] = useState<SampleKey>(SampleKey.none);
    const [sampleSize, setSampleSize] = useState<number>(500);
    const [charset, setCharset] = useState<Charset>('utf-8');

    const [preview, setPreview] = useState<File | null>(null);
    const [previewOfRaw, setPreviewOfRaw] = useState<string | null>(null);
    const [previewOfFile, setPreviewOfFile] = useState<Awaited<ReturnType<typeof loadDataFile>> | null>(null);

    const filePreviewPendingRef = useRef<Promise<unknown>>();

    useEffect(() => {
        filePreviewPendingRef.current = undefined;
        if (preview) {
            setPreviewOfRaw(null);
            setPreviewOfFile(null);
            toggleLoadingAnimation(true);
            const p = Promise.all([
                readRaw(preview, charset, 1024, 32, 128),
                loadDataFile({
                    file: preview,
                    sampleMethod,
                    sampleSize,
                    encoding: charset,
                    onLoading: onDataLoading
                }),
            ]);
            filePreviewPendingRef.current = p;
            p.then(res => {
                if (p !== filePreviewPendingRef.current) {
                    return;
                }
                setPreviewOfRaw(res[0]);
                setPreviewOfFile(res[1]);
            }).catch(reason => {
                onLoadingFailed(reason);
            }).finally(() => {
                toggleLoadingAnimation(false);
            });
        } else {
            setPreviewOfFile(null);
        }
    }, [charset, onDataLoading, onLoadingFailed, preview, sampleMethod, sampleSize, toggleLoadingAnimation]);

    const handleFileLoad = useCallback((file: File | null) => {
        setPreview(file);
    }, []);

    const handleFileSubmit = useCallback(() => {
        if (!previewOfFile || !preview) {
            return;
        }
        const { fields, dataSource } = previewOfFile;
        logDataImport({
            dataType: 'File',
            fields,
            dataSource: dataSource.slice(0, 10),
            size: dataSource.length
        });
        dataBackup(preview);
        onDataLoaded(fields, dataSource, preview.name);
        onClose();
    }, [onClose, onDataLoaded, preview, previewOfFile]);

    return (
        <Container>
            <header>{intl.get('dataSource.upload.new')}</header>
            <FileHelper
                charset={charset}
                setCharset={setCharset}
                sampleMethod={sampleMethod}
                setSampleMethod={setSampleMethod}
                sampleSize={sampleSize}
                setSampleSize={setSampleSize}
                preview={preview}
            />
            <FileUpload preview={preview} previewOfFile={previewOfFile} previewOfRaw={previewOfRaw} onFileUpload={handleFileLoad} />
            {preview ? (
                previewOfFile && (
                    <div className="action">
                        <PrimaryButton
                            text={intl.get('dataSource.importData.load')}
                            onClick={handleFileSubmit}
                        />
                    </div>
                )
            ) : (
                <>
                    <header>{intl.get('dataSource.upload.history')}</header>
                    <HistoryList onDataLoaded={onDataLoaded} onLoadingFailed={onLoadingFailed} onClose={onClose} />
                </>
            )}
        </Container>
    );
};

export default observer(FileData);
