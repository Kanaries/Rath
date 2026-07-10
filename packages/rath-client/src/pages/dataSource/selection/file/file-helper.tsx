import intl from 'react-intl-universal';
import { FC, useMemo, useState } from 'react';
import styled from 'styled-components';
import produce from 'immer';
import { RathSelect } from '../../../../components/rath-ui/rath-select';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../../../components/ui/radio-group';
import { SampleKey, useSampleOptions } from '../../utils';

export const charsetOptions = [
    {
        text: 'UTF-8',
        key: 'utf-8',
    },
    {
        text: 'GB2312',
        key: 'gb2312',
    },
    {
        text: 'US-ASCII',
        key: 'us-ascii',
    },
    {
        text: 'Big5',
        key: 'big5',
    },
    {
        text: 'Big5-HKSCS',
        key: 'Big5-HKSCS',
    },
    {
        text: 'GB18030',
        key: 'GB18030',
    },
] as const;

export type Charset = typeof charsetOptions[number]['key'];

const Container = styled.div`
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 1em;
    row-gap: 1em;
    padding-top: 1em;
    & label {
        font-weight: 400;
        margin-right: 1em;
        text-transform: capitalize;
    }
    > * {
        margin-bottom: 0.8em;
    }
    & .spin-group {
        display: flex;
        flex-direction: row;
        align-items: center;
        /* & * {
            min-width: unset;
            width: max-content;
            height: max-content;
            min-height: unset;
        } */
        > * {
            flex-grow: 0;
            flex-shrink: 0;
            width: max-content;
            white-space: nowrap;
            margin-left: 0.5em;
            :first-child {
                margin-left: 0;
            }
        }
        /* & input {
            width: 3em;
        } */
    }
`;

export interface IFileHelperProps {
    showMoreConfig: boolean;
    charset: Charset;
    setCharset: (charset: Charset) => void;
    sampleMethod: SampleKey;
    setSampleMethod: (sampleMethod: SampleKey) => void;
    sampleSize: number;
    setSampleSize: (sampleSize: number | ((prev: number) => number)) => void;
    preview: File | null;
    isExcel: boolean;
    excelRef: [[number, number], [number, number]];
    excelRange: [[number, number], [number, number]];
    setExcelRange: (range: [[number, number], [number, number]]) => void;
    sheetNames: string[] | false;
    selectedSheetIdx: number;
    setSelectedSheetIdx: (selectedSheetIdx: number) => void;
    separator: string;
    setSeparator: (separator: string) => void;
}

const FileHelper: FC<IFileHelperProps> = ({
    showMoreConfig,
    charset,
    setCharset,
    sampleMethod,
    setSampleMethod,
    sampleSize,
    setSampleSize,
    preview,
    sheetNames,
    selectedSheetIdx,
    setSelectedSheetIdx,
    separator,
    setSeparator,
    isExcel,
    excelRef,
    excelRange,
    setExcelRange,
}) => {
    const sampleOptions = useSampleOptions();
    const [customizeSeparator, setCustomizeSeparator] = useState('');

    const separatorOptions = useMemo(() => {
        return [
            { key: ',', text: intl.get('dataSource.upload.separator.comma') },
            { key: '\t', text: intl.get('dataSource.upload.separator.tab') },
            { key: ';', text: intl.get('dataSource.upload.separator.semicolon') },
            { key: '', text: intl.get('dataSource.upload.separator.other') },
        ];
    }, []);

    const selectedSeparatorKey = separatorOptions.find((opt) => opt.key === separator)?.key ?? '';
    const updateNumber = (value: string, next: (n: number) => void) => {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
            next(parsed);
        }
    };

    return (
        <Container>
            {showMoreConfig && (
                <>
                    <Label>{intl.get('dataSource.charset')}</Label>
                    <RathSelect
                        className="max-w-[120px]"
                        options={charsetOptions.slice()}
                        selectedKey={charset}
                        onChange={(key) => {
                            setCharset(key as Charset);
                        }}
                    />
                </>
            )}
            {(!preview || preview.type.match(/^text\/.*/)) && (
                <>
                    {showMoreConfig && (
                        <>
                            <Label>{intl.get('dataSource.separator')}</Label>
                            <RadioGroup
                                value={`${selectedSeparatorKey}`}
                                onValueChange={(value) => {
                                    setSeparator(value);
                                }}
                                className="flex flex-wrap items-center gap-3"
                            >
                                {separatorOptions.map((option) => (
                                    <div key={option.key || 'custom'} className="flex items-center gap-2">
                                        <RadioGroupItem id={`file-separator-${option.key || 'custom'}`} value={option.key} />
                                        <Label htmlFor={`file-separator-${option.key || 'custom'}`}>{option.text}</Label>
                                    </div>
                                ))}
                                <Input
                                    className="h-7 w-24"
                                    value={customizeSeparator}
                                    name="rath_upload_file_col_separator"
                                    onChange={(event) => {
                                        const { value } = event.target;
                                        setCustomizeSeparator(value);
                                        if (value) {
                                            setSeparator(value);
                                        }
                                    }}
                                />
                            </RadioGroup>
                        </>
                    )}
                    {(!preview || preview.type === 'text/csv') && separator === ',' && (
                        <>
                            <Label>{intl.get('dataSource.upload.sampling')}</Label>
                            <RadioGroup
                                value={sampleMethod}
                                onValueChange={(value) => {
                                    setSampleMethod(value as SampleKey);
                                }}
                                className="flex flex-wrap items-center gap-3"
                            >
                                {sampleOptions.map((option) => (
                                    <div key={option.key} className="flex items-center gap-2">
                                        <RadioGroupItem id={`file-sample-${option.key}`} value={option.key} />
                                        <Label htmlFor={`file-sample-${option.key}`}>{option.text}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            {sampleMethod === SampleKey.reservoir && (
                                <>
                                    <Label>{intl.get('dataSource.upload.percentSize')}</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={sampleSize.toString()}
                                        onChange={(event) => {
                                            updateNumber(event.target.value, setSampleSize);
                                        }}
                                    />
                                </>
                            )}
                        </>
                    )}
                </>
            )}
            {sheetNames && (
                <>
                    <Label>{intl.get('dataSource.upload.sheet')}</Label>
                    <RathSelect
                        className="max-w-[20em]"
                        options={sheetNames.map((name, i) => ({ key: `${i}`, text: name }))}
                        selectedKey={`${selectedSheetIdx}`}
                        onChange={(key) => {
                            if (key) {
                                setSelectedSheetIdx(Number(key));
                            }
                        }}
                    />
                </>
            )}
            {isExcel && (
                <>
                    <Label>{intl.get('dataSource.upload.excel_range')}</Label>
                    <div className="spin-group">
                        <Input
                            type="number"
                            value={String(excelRange[0][0])}
                            min={excelRef[0][0]}
                            max={Math.min(excelRef[1][0], excelRange[1][0])}
                            step={1}
                            className="w-16"
                            onChange={(event) =>
                                updateNumber(event.target.value, (value) => {
                                    setExcelRange(
                                        produce(excelRange, (draft) => {
                                            draft[0][0] = value;
                                        })
                                    );
                                })
                            }
                        />
                        <span>,</span>
                        <Input
                            type="number"
                            value={String(excelRange[0][1])}
                            min={excelRef[0][1]}
                            max={Math.min(excelRef[1][1], excelRange[1][1])}
                            step={1}
                            className="w-16"
                            onChange={(event) =>
                                updateNumber(event.target.value, (value) => {
                                    setExcelRange(
                                        produce(excelRange, (draft) => {
                                            draft[0][1] = value;
                                        })
                                    );
                                })
                            }
                        />
                        <span>{'-'}</span>
                        <Input
                            type="number"
                            value={String(excelRange[1][0])}
                            min={Math.max(excelRef[0][0], excelRange[0][0])}
                            max={excelRef[1][0]}
                            step={1}
                            className="w-16"
                            onChange={(event) =>
                                updateNumber(event.target.value, (value) => {
                                    setExcelRange(
                                        produce(excelRange, (draft) => {
                                            draft[1][0] = value;
                                        })
                                    );
                                })
                            }
                        />
                        <span>,</span>
                        <Input
                            type="number"
                            value={String(excelRange[1][1])}
                            min={Math.max(excelRef[0][1], excelRange[0][1])}
                            max={excelRef[1][1]}
                            step={1}
                            className="w-16"
                            onChange={(event) =>
                                updateNumber(event.target.value, (value) => {
                                    setExcelRange(
                                        produce(excelRange, (draft) => {
                                            draft[1][1] = value;
                                        })
                                    );
                                })
                            }
                        />
                    </div>
                </>
            )}
        </Container>
    );
};

export default FileHelper;
