import { FC, useState, useRef, useCallback, useEffect } from "react";
import { PrimaryButton, Toggle } from '@fluentui/react';
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import * as xlsx from 'xlsx';
import intl from "react-intl-universal";
import { isExcelFile, loadDataFile, loadExcelFile, loadExcelRaw, parseExcelFile, readRaw, SampleKey } from "../../utils";
import { dataBackup, logDataImport } from "../../../../loggers/dataImport";
import { IMuteFieldBase, IRow } from "../../../../interfaces";
import { DataSourceTag, IDBMeta } from "../../../../utils/storage";
import HistoryList from "../history/history-list";
import FileUpload from "./file-upload";
import FileHelper, { Charset } from "./file-helper";


const Container = styled.div`
    max-width: 680px;
    > header {
        margin-top: 1.2em;
        font-weight: 550;
        &.upload {
            display: flex;
            flex-direction: row;
            align-items: center;
            > span {
                flex-grow: 1;
                flex-shrink: 1;
            }
            > div {
                margin: 0;
                flex-grow: 0;
                flex-shrink: 0;
                transform: scale(0.9);
                > label {
                    padding-left: 0.3em;
                    margin: 0;
                    font-weight: 500;
                }
                > div {
                    transform: scale(0.8);
                }
            }
        }
    }
    > .action {
        margin: 1em 0;
    }
`;

interface FileDataProps {
    onClose: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag, withHistory?: IDBMeta | undefined) => void;
    onDataLoading: (p: number) => void;
    toggleLoadingAnimation: (on: boolean) => void;
}

const FileData: FC<FileDataProps> = (props) => {
    const { onClose, onDataLoaded, onLoadingFailed, onDataLoading, toggleLoadingAnimation } = props;
    const [sampleMethod, setSampleMethod] = useState<SampleKey>(SampleKey.none);
    const [sampleSize, setSampleSize] = useState<number>(500);
    const [charset, setCharset] = useState<Charset>('utf-8');
    const [separator, setSeparator] = useState(',');
    const [appliedSeparator, setAppliedSeparator] = useState(separator);

    useEffect(() => {
        setPreviewOfRaw(null);
        setPreviewOfFile(null);
        setExcelFile(false);
        const delay = setTimeout(() => {
            setAppliedSeparator(separator);
        }, 1_000);
        return () => {
            clearTimeout(delay);
        };
    }, [separator]);

    const [preview, setPreview] = useState<File | null>(null);
    const [previewOfRaw, setPreviewOfRaw] = useState<string | null>(null);
    const [previewOfFull, setPreviewOfFull] = useState<Awaited<ReturnType<typeof loadDataFile>> | null>(null);
    const [previewOfFile, setPreviewOfFile] = useState<Awaited<ReturnType<typeof loadDataFile>> | null>(null);

    const [excelFile, setExcelFile] = useState<Awaited<ReturnType<typeof parseExcelFile>> | false>(false);
    const [selectedSheetIdx, setSelectedSheetIdx] = useState(-1);
    const [excelRef, setExcelRef] = useState<[[number, number], [number, number]]>([[0, 0], [0, 0]]);
    const [excelRange, setExcelRange] = useState<[[number, number], [number, number]]>([[0, 0], [0, 0]]);

    useEffect(() => {
        if (excelFile && excelFile.SheetNames.length > 0) {
            setSelectedSheetIdx(0)
        } else {
            setSelectedSheetIdx(-1);
        }
    }, [excelFile]);

    const filePreviewPendingRef = useRef<Promise<unknown>>();

    const inputRef = useRef<{ reset: () => void }>(null);

    useEffect(() => {
        filePreviewPendingRef.current = undefined;
        if (preview) {
            setPreviewOfRaw(null);
            setPreviewOfFull(null);
            setPreviewOfFile(null);
            setExcelFile(false);
            // toggleLoadingAnimation(true);
            if (isExcelFile(preview)) {
                const p = parseExcelFile(preview);
                filePreviewPendingRef.current = p;
                p.then(res => {
                    if (p !== filePreviewPendingRef.current) {
                        return;
                    }
                    setExcelFile(res);
                }).catch(() => {
                    inputRef.current?.reset();
                }).finally(() => {
                    // toggleLoadingAnimation(false);
                });
                return;
            }
            const p = Promise.allSettled([
                readRaw(preview, charset, 4096, 64, 128),
                loadDataFile({
                    file: preview,
                    sampleMethod,
                    sampleSize,
                    encoding: charset,
                    onLoading: onDataLoading,
                    separator: appliedSeparator,
                }),
            ]);
            filePreviewPendingRef.current = p;
            p.then(res => {
                if (p !== filePreviewPendingRef.current) {
                    return;
                }
                setPreviewOfRaw(res[0].status === 'fulfilled' ? res[0].value : null);
                setPreviewOfFull(null);
                setPreviewOfFile(res[1].status === 'fulfilled' ? res[1].value : null);
            }).catch(reason => {
                onLoadingFailed(reason);
                inputRef.current?.reset();
            }).finally(() => {
                // toggleLoadingAnimation(false);
            });
        } else {
            setPreviewOfRaw(null);
            setPreviewOfFull(null);
            setPreviewOfFile(null);
        }
    }, [charset, onDataLoading, onLoadingFailed, preview, sampleMethod, sampleSize, toggleLoadingAnimation, appliedSeparator]);

    useEffect(() => {
        if (excelFile && selectedSheetIdx !== -1) {
            setPreviewOfRaw(null);
            setPreviewOfFull(null);
            setPreviewOfFile(null);
            const sheet = excelFile.Sheets[excelFile.SheetNames[selectedSheetIdx]];
            const range = sheet["!ref"] ? xlsx.utils.decode_range(sheet["!ref"]) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
            const rangeRef = [[range.s.r, range.s.c], [range.e.r, range.e.c]] as [[number, number], [number, number]];
            setExcelRef(rangeRef);
            setExcelRange(rangeRef);
            filePreviewPendingRef.current = undefined;
            // toggleLoadingAnimation(true);
            const p = Promise.allSettled([
                loadExcelRaw(excelFile, selectedSheetIdx, 4096, 64, 128),
                loadExcelFile(excelFile, selectedSheetIdx, charset),
            ] as const);
            filePreviewPendingRef.current = p;
            p.then(res => {
                if (p !== filePreviewPendingRef.current) {
                    return;
                }
                setPreviewOfRaw(res[0].status === 'fulfilled' ? res[0].value : null);
                setPreviewOfFull(res[1].status === 'fulfilled' ? res[1].value : null);
            }).catch(reason => {
                onLoadingFailed(reason);
                inputRef.current?.reset();
            }).finally(() => {
                // toggleLoadingAnimation(false);
            });
        }
    }, [excelFile, onLoadingFailed, selectedSheetIdx, toggleLoadingAnimation, charset]);

    useEffect(() => {
        if (excelFile && previewOfFull) {
            setPreviewOfFile(null);
            filePreviewPendingRef.current = undefined;
            // toggleLoadingAnimation(true);
            const p = loadExcelFile(excelFile, selectedSheetIdx, charset, excelRange);
            filePreviewPendingRef.current = p;
            p.then(res => {
                if (p !== filePreviewPendingRef.current) {
                    return;
                }
                setPreviewOfFile(res);
            }).catch(reason => {
                onLoadingFailed(reason);
            }).finally(() => {
                // toggleLoadingAnimation(false);
            });
        }
    }, [charset, excelFile, excelRange, onLoadingFailed, previewOfFull, selectedSheetIdx, toggleLoadingAnimation]);

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
        onDataLoaded(fields, dataSource, preview.name, DataSourceTag.FILE);
        onClose();
    }, [onClose, onDataLoaded, preview, previewOfFile]);

    const [showMoreConfig, setShowMoreConfig] = useState(false);

    return (
        <Container>
            <header className="upload">
                <span>{intl.get('dataSource.upload.new')}</span>
                <Toggle
                    label={intl.get('dataSource.upload.show_more')}
                    inlineLabel
                    checked={showMoreConfig}
                    onChange={(_, checked) => setShowMoreConfig(Boolean(checked))}
                />
            </header>
            <FileHelper
                showMoreConfig={showMoreConfig}
                charset={charset}
                setCharset={setCharset}
                sampleMethod={sampleMethod}
                setSampleMethod={setSampleMethod}
                sampleSize={sampleSize}
                setSampleSize={setSampleSize}
                preview={preview}
                sheetNames={excelFile ? excelFile.SheetNames : false}
                selectedSheetIdx={selectedSheetIdx}
                setSelectedSheetIdx={setSelectedSheetIdx}
                separator={separator}
                setSeparator={setSeparator}
                isExcel={Boolean(excelFile)}
                excelRef={excelRef}
                excelRange={excelRange}
                setExcelRange={setExcelRange}
            />
            <FileUpload
                ref={inputRef}
                preview={preview}
                previewOfRaw={previewOfRaw}
                previewOfFull={previewOfFull}
                previewOfFile={previewOfFile}
                onFileUpload={handleFileLoad}
            />
            {preview && (
                <div className="action">
                    <PrimaryButton
                        text={intl.get('dataSource.importData.load')}
                        disabled={!previewOfFile}
                        onClick={handleFileSubmit}
                    />
                </div>
            )}
            {!preview && (
                <>
                    <header>{intl.get('dataSource.upload.history')}</header>
                    <HistoryList
                        is={DataSourceTag.FILE}
                        onDataLoaded={onDataLoaded}
                        onLoadingFailed={onLoadingFailed}
                        onClose={onClose}
                    />
                </>
            )}
        </Container>
    );
};

export default observer(FileData);
